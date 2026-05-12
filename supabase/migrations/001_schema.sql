-- 001_schema.sql
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: countries
CREATE TABLE countries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  flag_emoji  TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: leagues
CREATE TABLE leagues (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id  UUID REFERENCES countries(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  season      TEXT NOT NULL DEFAULT '2026',
  api_id      INT UNIQUE, -- ID en API-Football (Chile=265, Ecuador=240, Peru=345)
  active      BOOLEAN DEFAULT true
);

-- 3. TABLA: clubs
CREATE TABLE clubs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id     UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  logo_url      TEXT,
  api_team_id   INT UNIQUE, -- ID en API-Football
  status        TEXT DEFAULT 'activo', -- 'activo', 'vallasfijas', 'futuro'
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: clients
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id     UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL, -- 'LIONS', 'CLUB', 'OTROS'
  minutes     NUMERIC DEFAULT 0,
  bonified    NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: user_profiles (extensión de auth.users)
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'pending', -- 'admin', 'producer', 'operator', 'club_staff', 'pending'
  avatar_url  TEXT,
  reg_notes   TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: user_club_assignments (reemplaza el array de UUIDs)
CREATE TABLE user_club_assignments (
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  club_id     UUID REFERENCES clubs(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, club_id)
);

-- 7. TABLA: matches
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id       UUID REFERENCES leagues(id) ON DELETE CASCADE,
  home_club_id    UUID REFERENCES clubs(id) ON DELETE CASCADE,
  away_club_id    UUID REFERENCES clubs(id) ON DELETE CASCADE,
  away_team_name  TEXT,
  away_team_logo  TEXT,
  match_date      TIMESTAMPTZ NOT NULL,
  venue           TEXT,
  city            TEXT,
  round           TEXT,
  api_match_id    INT UNIQUE,
  status          TEXT DEFAULT 'scheduled', -- 'scheduled', 'finished', etc. de la API
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: match_events (Flujo de confirmación y playlists)
CREATE TABLE match_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID REFERENCES matches(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  -- Tipos de event_type: 
  -- 'club_confirmed' | 'producer_confirmed' | 'playlist_uploaded' 
  -- | 'club_approved' | 'producer_approved' | 'delivered'
  actor_id    UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  actor_name  TEXT,           -- snapshot para display rápido
  notes       TEXT,           -- "Todo igual" / "Hay cambio en..."
  payload     JSONB,          -- { "playlist_url": "https://..." } para uploads
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- VISTA: match_status (calcula el estado actual del partido en base al último evento)
CREATE OR REPLACE VIEW match_status AS
SELECT DISTINCT ON (m.id)
  m.id AS match_id,
  m.match_date,
  m.home_club_id,
  CASE
    WHEN EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id AND event_type = 'delivered') THEN 'delivered'
    WHEN EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id AND event_type = 'producer_approved')
     AND EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id AND event_type = 'club_approved') THEN 'approved'
    WHEN EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id AND event_type = 'playlist_uploaded') THEN 'playlist_ready'
    WHEN EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id AND event_type = 'producer_confirmed')
     AND EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id AND event_type = 'club_confirmed') THEN 'all_confirmed'
    WHEN EXISTS (SELECT 1 FROM match_events WHERE match_id = m.id AND event_type = 'club_confirmed') THEN 'club_confirmed'
    ELSE 'scheduled'
  END AS status,
  (SELECT payload->>'playlist_url' FROM match_events 
   WHERE match_id = m.id AND event_type = 'playlist_uploaded' 
   ORDER BY created_at DESC LIMIT 1) AS playlist_url
FROM matches m;

-- 9. TABLA: requests (Solicitudes/Tickets)
CREATE TABLE requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id         UUID REFERENCES clubs(id) ON DELETE CASCADE,
  creator_id      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_to_id  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  type            TEXT NOT NULL, -- 'arte_nuevo', 'update_arte', 'reemplazo_marca', etc.
  status          TEXT NOT NULL DEFAULT 'abierta', -- 'abierta', 'en_proceso', 'aprobada', 'rechazada'
  priority        TEXT NOT NULL DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'
  title           TEXT NOT NULL,
  description     TEXT,
  attachments     TEXT[], -- array de URLs (ej: Google Drive)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: work_entries (Registro de trabajo artístico)
CREATE TABLE work_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id    UUID REFERENCES requests(id) ON DELETE CASCADE,
  worker_id     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  club_id       UUID REFERENCES clubs(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  date_done     DATE NOT NULL DEFAULT CURRENT_DATE,
  net_value     NUMERIC DEFAULT 0,
  currency      TEXT DEFAULT 'CLP',
  billing_type  TEXT, -- 'boleta', 'factura'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- VISTA: monthly_work_summary (resumen mensual para pagos)
CREATE VIEW monthly_work_summary AS
SELECT
  DATE_TRUNC('month', date_done) AS month,
  worker_id,
  club_id,
  billing_type,
  currency,
  COUNT(*) AS task_count,
  SUM(net_value) AS total_net_value
FROM work_entries
GROUP BY month, worker_id, club_id, billing_type, currency;
