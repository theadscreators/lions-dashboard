# 🦁 LIONS Sports Media — Plan de Desarrollo Definitivo
### Versión 3.0 · Consolidado con todo lo hablado · Mayo 2026

---

## 📍 ESTADO ACTUAL — Auditoría del Código

Antes de planificar qué construir, es fundamental entender qué ya existe y qué funciona bien.

### ✅ Lo que ya funciona y hay que PRESERVAR

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Logos locales** | SVGs organizados en `/logos/chile/`, `/ecuador/`, `/peru/` | ✅ Excelente |
| **LionsSVG inline** | Logo vectorial embebido, sin dependencia externa | ✅ Mantener |
| **TheSportsDB** | Ya integrado con `leagueId: "4627"` para Chile + cache de 30min | ✅ Mejorar |
| **Pills de marcas** | Cards muestran clientes Lions como pills coloreadas | ✅ Excelente |
| **Drawer derecho** | Desliza desde la derecha, con backdrop blur | ✅ Mantener |
| **Dark/Light theme** | Sistema de tokens completo, `T.dark` y `T.light` | ✅ Mantener |
| **Flags de flagcdn.com** | `https://flagcdn.com/w20/{codigo}.png` | ✅ Mantener |
| **Grid/List toggle** | Dos vistas de equipos, responsive | ✅ Mantener |
| **InvestorsView** | Vista de clientes Lions por país | ✅ Expandir |
| **Sort con dirección** | Botones de ordenamiento bidireccional | ✅ Mantener |
| **Data completa 2026** | Chile (11+4), Ecuador (3), Perú (4) con todos los clientes | ✅ Migrar a Supabase |

### ⚠️ Problemas a corregir antes de avanzar

1. **Lógica de estado incorrecta** — Los bonificados NO deben contar para el cálculo de disponibilidad
2. **Sin navegación por secciones** — Todo está en una sola "pantalla" con selector de países
3. **Sin bottom nav** — Diseño solo para escritorio, no optimizado para mobile
4. **Data hardcodeada** — Imposible actualizar sin tocar código
5. **Sin roles** — Un solo password compartido
6. **TheSportsDB limitado** — 1 evento por request en free, hay que buscar alternativa o workaround
7. **Sin sección Agenda** — No hay flujo de confirmación de partidos ni playlists
8. **Sin Clientes global** — El InvestorsView es solo por país, no hay filtros por liga

---

## 🏗️ ARQUITECTURA FINAL

```
FRONTEND                    BACKEND                 SERVICIOS EXTERNOS
React + Vite               Supabase                Dropbox API v2
React Router v6            PostgreSQL + RLS         API-Football (fixtures)
Recharts (gráficos)        Auth + Magic Links       flagcdn.com (flags)  
date-fns (fechas)          Edge Functions (cron)    TheSportsDB (mejorado)
lucide-react (iconos)      Realtime subscriptions   Resend (emails)
jsPDF (exportar)           Supabase Storage
```

### ¿Por qué Supabase?
- Auth con roles, Magic Links y registro automático sin código extra
- Row Level Security nativa en PostgreSQL → cada rol ve solo lo que le corresponde sin lógica de backend
- Realtime → solicitudes y log se actualizan en vivo
- Dashboard propio → editar datos sin código (para emergencias)
- Free tier: 500MB DB, 1GB storage, 50K usuarios/mes → suficiente para escalar

---

## 📁 ESTRUCTURA DE ARCHIVOS FINAL

```
lions-dashboard/
├── public/
│   └── logos/
│       ├── chile/          ← SVGs ya existentes ✅
│       ├── ecuador/        ← SVGs ya existentes ✅
│       └── peru/           ← SVGs ya existentes ✅
├── src/
│   ├── main.jsx
│   ├── App.jsx             ← solo Router + Shell + rutas
│   ├── index.css
│   │
│   ├── theme/
│   │   └── theme.js        ← T.dark / T.light extraído del App.jsx actual
│   │
│   ├── lib/
│   │   ├── supabase.js     ← cliente Supabase configurado
│   │   ├── calcStats.js    ← calcStats(), getStatus(), statusLabel() — LÓGICA CORREGIDA
│   │   ├── formatters.js   ← fmt(), formatDate()
│   │   ├── dropbox.js      ← Dropbox API client
│   │   └── alertEngine.js  ← generación automática de alertas
│   │
│   ├── hooks/
│   │   ├── useAuth.js          ← user, role, club_id, login, logout
│   │   ├── useClubs.js         ← fetch clubs + clients desde Supabase
│   │   ├── useMatches.js       ← calendario de partidos
│   │   ├── usePlaylists.js     ← playlists por partido
│   │   ├── useRequests.js      ← solicitudes (crear, listar, aprobar)
│   │   ├── useAlerts.js        ← alertas comerciales
│   │   └── useWorkLog.js       ← registro trabajo artístico (solo admin)
│   │
│   ├── data/
│   │   └── seed_2026.json      ← datos actuales para script de migración
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── AnimatedBar.jsx
│   │   │   ├── StackedBar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Pill.jsx
│   │   │   ├── Drawer.jsx      ← drawer lateral reutilizable
│   │   │   ├── BottomNav.jsx   ← nav mobile (5 tabs)
│   │   │   ├── TopNav.jsx      ← header con LionsSVG
│   │   │   └── LionsSVG.jsx    ← extraído del App.jsx actual ✅
│   │   │
│   │   ├── teams/
│   │   │   ├── TeamCard.jsx    ← con pills de marcas ✅
│   │   │   ├── TeamRow.jsx     ← lista compacta ✅
│   │   │   ├── TeamDetail.jsx  ← drawer detail ✅
│   │   │   └── TeamFilters.jsx ← filtros y sort
│   │   │
│   │   ├── clients/
│   │   │   ├── ClientRanking.jsx
│   │   │   ├── ClientChart.jsx   ← Recharts
│   │   │   └── ClientDetail.jsx  ← drawer con detalle por liga
│   │   │
│   │   ├── agenda/
│   │   │   ├── MatchCard.jsx
│   │   │   ├── MatchDetail.jsx
│   │   │   └── ConfirmChecklist.jsx
│   │   │
│   │   ├── playlists/
│   │   │   ├── PlaylistCard.jsx
│   │   │   └── PlaylistUpload.jsx
│   │   │
│   │   ├── requests/
│   │   │   ├── RequestForm.jsx
│   │   │   ├── RequestCard.jsx
│   │   │   └── AuditLog.jsx
│   │   │
│   │   └── worklog/
│   │       ├── WorkEntry.jsx
│   │       ├── WorkLogList.jsx
│   │       └── WorkReport.jsx
│   │
│   └── pages/
│       ├── Login.jsx
│       ├── Register.jsx        ← auto-registro con descripción
│       ├── Panel.jsx           ← HOME personalizado por rol
│       ├── Ligas.jsx           ← vista actual mejorada
│       ├── Clientes.jsx        ← ranking con filtros de liga
│       ├── Agenda.jsx          ← NUEVA 5ta sección
│       └── Ajustes.jsx         ← admin: solicitudes, log, usuarios, work log
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql
│   │   ├── 002_rls.sql
│   │   └── 003_seed.sql
│   └── functions/
│       ├── sync-fixtures/      ← cron API-Football
│       └── send-notification/  ← emails via Resend
│
├── .env
├── vite.config.js
└── package.json
```

---

## 👥 ROLES Y PERMISOS — DEFINITIVO

### Los 5 roles del sistema

| Rol | Quiénes | Acceso |
|-----|---------|--------|
| **admin** | Vos + socia (2-3 personas) | Todo, incluyendo precios y work log |
| **producer** | Sellers / productores (~5) | Todo comercial, sin precios |
| **club_staff** | Staff de cada club (varios por club) | Solo su club |
| **operator** | Técnicos de estadio (múltiples clubes) | Solo agenda + descarga playlists |
| *(futuro)* **read_only** | Invitados / supervisores | Solo vista, sin acciones |

### Matriz de permisos completa

| Acción | Admin | Producer | Club Staff | Operator |
|--------|-------|----------|------------|----------|
| Ver todos los clubes | ✅ | ✅ | ❌ | ❌ |
| Ver su(s) club(s) | ✅ | ✅ | ✅ | ✅ |
| Ver clientes LIONS | ✅ | ✅ | ❌ | ❌ |
| Ver clientes CLUB | ✅ | ✅ | ✅ (propio) | ❌ |
| Editar clientes/minutos | ✅ | ❌ | ❌ | ❌ |
| Crear solicitudes (Lions) | ✅ | ✅ | ❌ | ❌ |
| Crear solicitudes (Club) | ✅ | ✅ | ✅ (propio) | ❌ |
| Ver TODAS las solicitudes | ✅ | ✅ | ❌ | ❌ |
| Ver solicitudes de su club | ✅ | ✅ | ✅ | ❌ |
| Aprobar/rechazar solicitudes | ✅ | ❌ | ❌ | ❌ |
| Ver log completo | ✅ | ✅ (sin precios) | ❌ | ❌ |
| Ver log de su club | ✅ | ✅ | ✅ | ❌ |
| Cargar playlist link | ✅ | ❌ | ❌ | ❌ |
| Marcar visto bueno playlist | ✅ | ✅ | ✅ | ❌ |
| Ver agenda / calendario | ✅ | ✅ | ✅ (propio) | ✅ (todos) |
| Descargar playlist | ✅ | ✅ | ✅ | ✅ |
| Ver precios / work log | ✅ | ❌ | ❌ | ❌ |
| Registrar trabajo artístico | ✅ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |
| Panel personalizado | 🔴 Completo | 🔴 Comercial | 🔵 Su club | 📅 Solo agenda |

### Registro de nuevos usuarios

```
Usuario completa formulario:
  ─ Email
  ─ Nombre completo
  ─ Descripción libre: "Soy del staff de comunicaciones de Palestino..."

¿Email termina en @lionssportsmedia.com?
  → SÍ: role = 'producer' automático
         Se envía email para crear contraseña
         Admin recibe notificación de nuevo usuario
  → NO: Admin recibe notificación con la descripción escrita
         Admin asigna manualmente: club_staff (+ asigna club) | operator | producer
         Se envía email de bienvenida con acceso

Admin puede cambiar roles en cualquier momento desde Ajustes > Usuarios
```

---

## 🗄️ BASE DE DATOS COMPLETA (Supabase / PostgreSQL)

```sql
-- ══════════════════════════════════════════════════
-- GEOGRAFÍA
-- ══════════════════════════════════════════════════
CREATE TABLE countries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,  -- "cl", "ec", "pe"
  flag_url   TEXT,
  active     BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

CREATE TABLE leagues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id   UUID REFERENCES countries(id),
  name         TEXT NOT NULL,
  season       TEXT NOT NULL DEFAULT '2026',
  api_id       INT,                 -- ID en API-Football
  tsdb_id      TEXT,                -- ID en TheSportsDB (ya en uso)
  active       BOOLEAN DEFAULT true
);

-- ══════════════════════════════════════════════════
-- CLUBES
-- ══════════════════════════════════════════════════
CREATE TABLE clubs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id    UUID REFERENCES leagues(id),
  name         TEXT NOT NULL,
  short_name   TEXT,
  logo_path    TEXT,     -- path local: "/logos/chile/palestino.svg"
  logo_url     TEXT,     -- URL externa (fallback)
  tsdb_name    TEXT,     -- nombre en TheSportsDB para match fuzzy
  api_team_id  INT,      -- ID en API-Football
  status       TEXT DEFAULT 'active',
  -- active | future | walls_only | pending
  notes        TEXT,
  max_minutes  INT DEFAULT 90,
  access_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════
-- CLIENTES / MINUTOS
-- ══════════════════════════════════════════════════
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID REFERENCES clubs(id),
  category    TEXT NOT NULL CHECK (category IN ('LIONS', 'CLUB', 'OTROS')),
  name        TEXT NOT NULL,
  minutes     NUMERIC(5,2) DEFAULT 0,
  bonified    NUMERIC(5,2) DEFAULT 0,
  -- bonificados son EXTRA, nunca se suman a los 90' reales
  active      BOOLEAN DEFAULT true,
  season      TEXT DEFAULT '2026',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- LÓGICA DE ESTADO CORREGIDA (solo en código, no en DB):
-- disponible = 90 - (SUM(minutes) WHERE bonified is ignored)
-- sobrevendido = solo si SUM(minutes sin bonif) > 90
-- bonificados aparecen como info extra, no modifican el estado

-- ══════════════════════════════════════════════════
-- PARTIDOS / CALENDARIO
-- ══════════════════════════════════════════════════
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id       UUID REFERENCES leagues(id),
  home_club_id    UUID REFERENCES clubs(id),
  away_club_id    UUID REFERENCES clubs(id),
  -- away_club_id puede ser NULL si es un equipo que no manejamos
  away_team_name  TEXT,   -- nombre del equipo visitante si no está en clubs
  away_team_logo  TEXT,
  match_date      TIMESTAMPTZ NOT NULL,
  venue           TEXT,
  city            TEXT,
  round           TEXT,
  api_match_id    INT UNIQUE,
  tsdb_event_id   TEXT UNIQUE,
  status          TEXT DEFAULT 'scheduled',
  -- scheduled | played | postponed | cancelled
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════
-- FLUJO DE CONFIRMACIÓN POR PARTIDO
-- ══════════════════════════════════════════════════
CREATE TABLE match_confirmations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id              UUID REFERENCES matches(id) UNIQUE,
  -- Estados del flujo
  club_confirmed        BOOLEAN DEFAULT false,
  club_confirmed_by     UUID,   -- user_id
  club_confirmed_at     TIMESTAMPTZ,
  club_notes            TEXT,   -- "Todo igual" / "Hay cambio en..."
  producer_confirmed    BOOLEAN DEFAULT false,
  producer_confirmed_by UUID,
  producer_confirmed_at TIMESTAMPTZ,
  producer_notes        TEXT,
  -- Playlist
  playlist_url          TEXT,   -- link Dropbox
  playlist_uploaded_by  UUID,
  playlist_uploaded_at  TIMESTAMPTZ,
  playlist_club_ok      BOOLEAN DEFAULT false,
  playlist_club_ok_by   UUID,
  playlist_club_ok_at   TIMESTAMPTZ,
  playlist_producer_ok  BOOLEAN DEFAULT false,
  playlist_producer_ok_by UUID,
  playlist_producer_ok_at TIMESTAMPTZ,
  -- Estado general
  final_status          TEXT DEFAULT 'pending',
  -- pending | club_confirmed | all_confirmed | playlist_ready | approved | delivered
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════
-- USUARIOS Y ROLES
-- ══════════════════════════════════════════════════
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'pending',
  -- admin | producer | club_staff | operator | pending
  -- 'pending' = esperando asignación por admin
  club_ids    UUID[],    -- array de clubs para operator (puede tener varios)
  -- para club_staff: solo 1 elemento; para operator: múltiples
  avatar_url  TEXT,
  reg_notes   TEXT,      -- descripción que escribió al registrarse
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════
-- SOLICITUDES DE CAMBIO
-- ══════════════════════════════════════════════════
CREATE TABLE requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL,
  -- add_client | remove_client | update_minutes | update_logo
  -- new_campaign | update_playlist | fix_render | custom_animation | other
  title             TEXT NOT NULL,
  description       TEXT,
  club_id           UUID REFERENCES clubs(id),
  created_by_id     UUID REFERENCES auth.users(id),
  created_by_name   TEXT,     -- snapshot
  created_by_email  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT DEFAULT 'pending',
  -- pending | in_review | approved | rejected | done
  priority          TEXT DEFAULT 'normal',
  -- low | normal | high | urgent
  resolved_by       UUID REFERENCES auth.users(id),
  resolved_at       TIMESTAMPTZ,
  resolution_notes  TEXT
);

CREATE TABLE request_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID REFERENCES requests(id),
  url         TEXT NOT NULL,
  file_name   TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════
-- LOG DE AUDITORÍA
-- ══════════════════════════════════════════════════
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,
  user_name     TEXT,
  user_role     TEXT,
  action        TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     UUID,
  entity_label  TEXT,     -- legible: "Betano @ Palestino"
  old_value     JSONB,
  new_value     JSONB,
  club_id       UUID,     -- para filtrar por club con RLS
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════
-- REGISTRO DE TRABAJO ARTÍSTICO (solo visible para admins)
-- ══════════════════════════════════════════════════
CREATE TABLE work_task_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,
  category     TEXT NOT NULL,
  -- partidos | adaptaciones | animaciones | creatividad | diseno | edicion
  unit_price   NUMERIC(10,2),   -- RLS: solo admins
  is_bundleable BOOLEAN DEFAULT true,
  active       BOOLEAN DEFAULT true
);

CREATE TABLE work_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID REFERENCES auth.users(id),
  club_id         UUID REFERENCES clubs(id),
  match_id        UUID REFERENCES matches(id),
  request_id      UUID REFERENCES requests(id),
  task_type_id    UUID REFERENCES work_task_types(id),
  title           TEXT NOT NULL,
  description     TEXT,
  date_done       DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity        NUMERIC(5,2) DEFAULT 1,
  is_bonified     BOOLEAN DEFAULT false,
  billing_type    TEXT DEFAULT 'included',
  -- included | extra_lions | extra_club | extra_brand
  billed_to       TEXT,
  net_value       NUMERIC(10,2),   -- RLS: solo admins
  currency        TEXT DEFAULT 'USD',
  invoice_ref     TEXT,
  status          TEXT DEFAULT 'done',
  -- done | invoiced | paid
  dropbox_url     TEXT,
  notes           TEXT,
  auto_generated  BOOLEAN DEFAULT false,
  -- true cuando se generó automáticamente al aprobar una solicitud
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Vista mensual (calculada)
CREATE VIEW monthly_work_summary AS
SELECT
  DATE_TRUNC('month', date_done) AS month,
  worker_id,
  club_id,
  billing_type,
  COUNT(*) AS task_count,
  SUM(net_value) AS total_net_value,
  currency
FROM work_entries
GROUP BY 1, 2, 3, 4, 6;

-- ══════════════════════════════════════════════════
-- ALERTAS COMERCIALES
-- ══════════════════════════════════════════════════
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL,
  -- opportunity | sold_out | overbooked
  -- match_upcoming | playlist_missing | client_expiring | new_registration
  priority        TEXT DEFAULT 'medium',
  title           TEXT NOT NULL,
  message         TEXT,
  club_id         UUID REFERENCES clubs(id),
  match_id        UUID REFERENCES matches(id),
  auto_generated  BOOLEAN DEFAULT true,
  resolved        BOOLEAN DEFAULT false,
  resolved_by     UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security — Políticas clave

```sql
-- Productores ven TODOS los clubs y solicitudes
CREATE POLICY "producers_see_all" ON clubs
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'producer')
  );

-- Club staff solo ve su propio club
CREATE POLICY "club_staff_own" ON clients
  FOR SELECT USING (
    club_id = ANY(
      SELECT UNNEST(club_ids) FROM user_profiles WHERE id = auth.uid()
    )
    OR (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'producer')
  );

-- Operators ven match_confirmations de sus clubs
CREATE POLICY "operators_confirmations" ON match_confirmations
  FOR SELECT USING (
    (SELECT home_club_id FROM matches WHERE id = match_id)
    = ANY(SELECT UNNEST(club_ids) FROM user_profiles WHERE id = auth.uid())
    OR (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer', 'operator')
  );

-- Work entries y precios: solo admins
CREATE POLICY "admin_only_work" ON work_entries
  FOR ALL USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solicitudes: producers ven TODAS; club_staff solo las de su club
CREATE POLICY "requests_visibility" ON requests
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'producer')
    OR club_id = ANY(
      SELECT UNNEST(club_ids) FROM user_profiles WHERE id = auth.uid()
    )
  );
```

---

## 🗺️ PLAN DE DESARROLLO — 10 ETAPAS

---

### ETAPA 0 — Correctivos Inmediatos (sin backend)
**⏱ ~1 semana · Prioridad: CRÍTICA — hacerlo antes de cualquier otra cosa**

**Objetivo:** Corregir los bugs de lógica y agregar las mejoras visuales más urgentes sobre el código actual, sin romper nada de lo que ya funciona.

**Tareas:**

#### A) Corregir lógica de estado (BUG CRÍTICO)
```js
// CORRECCIÓN en calcStats() — los bonificados NO cuentan para el estado
function calcStats(clientes) {
  const totalLions = clientes
    .filter(c => c.categoria === "LIONS")
    .reduce((s, c) => s + c.minutos, 0);  // solo minutos reales
  const totalClub = clientes
    .filter(c => c.categoria === "CLUB")
    .reduce((s, c) => s + c.minutos, 0);   // solo minutos reales
  const totalBonificados = clientes
    .reduce((s, c) => s + Math.max(0, c.bonificados), 0);  // siempre separado
  const totalReal = totalLions + totalClub;
  const disponibles = Math.max(0, 90 - totalReal);
  return { totalLions, totalClub, totalBonificados, totalReal, disponibles };
}

// Estados:
// available (verde):  totalReal < 90
// full (ámbar):       totalReal === 90  ← "Completo"
// over (gris oscuro): totalReal > 90    ← "Sobrevendido" — NO rojo
```

#### B) Agregar filtro por liga en InvestorsView
- Mover InvestorsView a su propia sección (Clientes)
- Agregar tabs: Global | Chile | Ecuador | Perú
- Agregar gráfico de barras con Recharts

#### C) Responsive / Layout desktop
- Detectar ancho con `window.innerWidth` o hook `useWindowWidth`
- Mobile (<768px): layout actual, cards de ancho completo
- Desktop (≥768px): grid 2-3 columnas, drawer lateral, header más ancho
- El selector de países en desktop se convierte en sidebar izquierdo

#### D) Mejorar TheSportsDB
- El problema actual: `eventsnextleague.php` devuelve múltiples partidos (verificar si el endpoint cambia con API key diferente)
- Workaround sin API key de pago: hacer N requests paralelos, uno por equipo (`eventsnextteam.php?id=TEAM_ID`)
- Mapear `tsdbTeamId` en cada equipo de la data

**Lo que queda listo al finalizar Etapa 0:**
- ✅ Lógica de minutos correcta en toda la app
- ✅ Clientes con filtro por liga y gráfico
- ✅ App usable en desktop y mobile
- ✅ Partidos mejores desde TheSportsDB

---

### ETAPA 1 — Refactoring & Navegación (5 Secciones)
**⏱ ~2 semanas · Prioridad: CRÍTICA**

**Objetivo:** Convertir el monolito (796 líneas, un archivo) en una app organizada y escalable, sin cambiar ninguna funcionalidad visible.

**Tareas:**

#### A) Instalar React Router v6
```bash
npm install react-router-dom
```

Rutas:
```
/           → Panel (home)
/ligas      → Ligas (vista actual)
/clientes   → Clientes (InvestorsView mejorado)
/agenda     → Agenda (nuevo - placeholder)
/ajustes    → Ajustes (admin - placeholder)
```

#### B) Separar en archivos
- Extraer `T` a `src/theme/theme.js`
- Extraer `LOGOS` y `PAISES` a `src/data/data_2026.js`
- Extraer helpers a `src/lib/calcStats.js` y `src/lib/formatters.js`
- Extraer `LionsSVG` a `src/components/ui/LionsSVG.jsx`
- Extraer `AnimatedBar`, `StackedBar` a `src/components/ui/`
- Extraer `TeamCard`, `TeamRow`, `TeamDetail` a `src/components/teams/`
- Extraer `InvestorsView` a `src/pages/Clientes.jsx`
- Crear `src/components/ui/BottomNav.jsx` (mobile, 5 tabs)
- Adaptar `App.jsx` como solo Router + Shell

#### C) Bottom Nav (mobile) + Top Nav adaptado
```
Mobile: bottom tabs fijos con 5 iconos
Desktop: top nav con tabs + drawer lateral

Tab 1: ⊞ PANEL
Tab 2: ⚽ LIGAS
Tab 3: 👥 CLIENTES
Tab 4: 📅 AGENDA   ← nuevo
Tab 5: ⚙ AJUSTES  ← con badge de solicitudes pendientes
```

**Lo que queda listo al finalizar Etapa 1:**
- ✅ Código modular y mantenible
- ✅ 5 secciones navegables (Agenda y Ajustes son placeholders)
- ✅ Bottom nav mobile + layout desktop mejorado
- ✅ Exactamente las mismas funcionalidades que hoy, mejor organizadas
- ❌ Pendiente: backend, auth real, contenido de Agenda y Ajustes

---

### ETAPA 2 — Backend Supabase (Auth + DB + Data)
**⏱ ~2-3 semanas · Prioridad: CRÍTICA**

**Objetivo:** Reemplazar data hardcodeada y contraseña única por base de datos real y autenticación con roles. Este es el paso más importante de todo el proyecto.

**Tareas:**

#### A) Setup Supabase
1. Crear proyecto en supabase.com (free tier)
2. Ejecutar migrations SQL (schema completo arriba)
3. Configurar RLS policies
4. Crear `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

#### B) Script de seed
- Node.js script que lee `lions_data_2026.csv` y hace `upsert` en Supabase
- Se ejecuta una sola vez para migrar todos los datos actuales
- Resultado: todas las tablas (`countries`, `leagues`, `clubs`, `clients`) llenas

#### C) Hooks de datos
```js
// src/hooks/useClubs.js
const { data: clubs } = await supabase
  .from('clubs')
  .select('*, clients(*)')
  .eq('league_id', leagueId);
```

#### D) Auth con roles
- **Admin/Producer:** email + password
- **Club Staff / Operator:** Magic Link (email → clic → dentro, sin contraseña)
- Hook `useAuth()` que expone: `{ user, role, clubIds, loading }`

#### E) Formulario de registro
- Email + nombre + descripción libre
- Si `@lionssportsmedia.com` → role `producer` automático
- Si otro mail → role `pending`, admin recibe alerta
- Admin gestiona desde Ajustes > Usuarios

#### F) Panel de usuarios (Ajustes)
- Lista de usuarios pendientes con su descripción
- Asignar rol + club(s)
- Cambiar rol en cualquier momento

**Lo que queda listo al finalizar Etapa 2:**
- ✅ Auth real con 5 roles
- ✅ Data en Supabase, editable desde el dashboard de Supabase
- ✅ RLS: cada rol ve solo lo que le corresponde
- ✅ Registro de nuevos usuarios con flujo automático
- ✅ Panel de gestión de usuarios
- ❌ Pendiente: Panel home, Agenda, Solicitudes

---

### ETAPA 3 — Panel Principal (Home Personalizado por Rol)
**⏱ ~2 semanas · Prioridad: ALTA**

**Objetivo:** Crear la pantalla de inicio que muestra información relevante según quién está logueado.

**Vista Admin/Producer:**
```
● ADMIN ACCESS · CENTRO OPERATIVO

[1.2K' Lions / 1.8K' total → 66% ocupado]
[Bar Lions roja + Club azul + Verde libre]

🇨🇱 Chile    🇪🇨 Ecuador   🇵🇪 Perú
420' libres  120' libres  60' libres

TOP 3 Equipos con más Disponibilidad
  #1 La Serena      18' libres
  #2 Ñublense       15' libres
  #3 Huachipato      5' libres

🗓️ PRÓXIMOS PARTIDOS (esta semana)
  Sáb 10 · Palestino vs CC · 0' libres [COMPLETO]
  Dom 11 · Huachipato vs UCH · 5' libres
  Mié 14 · Emelec · 30' libres [OPORTUNIDAD]

⚠ ALERTAS
  ⚡ Playlist faltante · Huachipato Dom 11
  ▲ Alta demanda · Palestino vs Colo-Colo

[⊕ NUEVA CAMPAÑA]
```

**Vista Club Staff (Palestino como ejemplo):**
```
🏟️ PALESTINO · Mi Panel

CLIENTES ACTIVOS
● BOP            4'  ████
● SAN JORGE      8'  ████████
● KAYSER         6'  ██████
...

PRÓXIMO PARTIDO DE LOCAL
📅 Sáb 10 · vs Colo-Colo · 20:00
   Est. San Carlos · Rancagua
   Playlist: ⏳ Pendiente
   [✓ Confirmar que todo sigue igual]

MIS SOLICITUDES RECIENTES
● Sumar Banco Estado → ✅ Completado
● Actualizar logo Betano → 🔄 En revisión
```

**Vista Operator:**
```
📅 PRÓXIMOS PARTIDOS — TU AGENDA

Sáb 10 Mayo · 20:00
Palestino vs Colo-Colo
📍 Est. San Carlos
Playlist: ✅ Lista [↓ DESCARGAR]

Dom 11 Mayo · 18:00
Huachipato vs U. Chile
📍 Est. CAP Acero
Playlist: ⏳ Pendiente
```

**Lo que queda listo al finalizar Etapa 3:**
- ✅ Panel home diferente según rol
- ✅ KPIs globales y por país
- ✅ Top equipos disponibles
- ✅ Próximos partidos con disponibilidad
- ✅ Alertas automáticas básicas
- ✅ CTA según rol (Nueva Campaña / Descargar Playlist)

---

### ETAPA 4 — Agenda (5ta Sección) + Flujo de Confirmación
**⏱ ~2-3 semanas · Prioridad: ALTA**

**Objetivo:** Crear el flujo completo de confirmación fecha a fecha y gestión de playlists por partido.

**El flujo de cada partido:**
```
1. Partido aparece en agenda (automático desde API o manual)
   Estado: 🔘 PROGRAMADO

2. Club confirma que todo sigue igual (o informa cambios)
   [✓ Confirmar sin cambios] / [✏ Hay cambios, describirlos]
   Estado: 🔵 CLUB CONFIRMADO

3. Productor revisa y confirma
   Estado: 🟡 CONFIRMADO AMBOS

4. Admin/Arte sube link de Dropbox con el package completo
   (playlist Excel + todos los materiales para el operador)
   Estado: 🟠 PLAYLIST LISTA

5. Club marca "visto bueno"
   Productor marca "visto bueno"
   Estado: 🟢 APROBADA

6. Operador descarga el material
   Estado: ✅ ENTREGADA
```

**Vista Agenda (por rol):**

| Lo que ve | Admin/Producer | Club Staff | Operator |
|-----------|---------------|------------|----------|
| Todos los partidos | ✅ | ❌ | ✅ |
| Solo su club | — | ✅ | — |
| Confirmar partido | ✅ | ✅ | ❌ |
| Subir playlist | ✅ | ❌ | ❌ |
| Dar visto bueno | ✅ | ✅ | ❌ |
| Descargar material | ✅ | ✅ | ✅ |

**Tabla `match_confirmations`** ya definida en el schema arriba.

**Generación de partidos:**
- Opción A (MVP): Admin carga manualmente en Supabase la lista de partidos de cada fecha → 5 min de trabajo por semana
- Opción B (futuro Etapa 9): Cron job automático con API-Football

**Alertas automáticas que genera esta etapa:**
- Partido en < 72hs sin playlist cargada → alerta urgente a admin
- Partido en < 48hs sin confirmación del club → alerta al producer
- Playlist lista pero sin visto bueno → alerta a club y producer

**Lo que queda listo al finalizar Etapa 4:**
- ✅ 5ta sección Agenda completamente funcional
- ✅ Flujo de confirmación fecha a fecha
- ✅ Subida de link de Dropbox por admin
- ✅ Descarga de material por todos los roles
- ✅ Vista personalizada según rol
- ✅ Alertas de playlist y confirmación
- ❌ Pendiente: sync automático de partidos (Etapa 9)

---

### ETAPA 5 — Sistema de Solicitudes + Log de Operaciones
**⏱ ~2-3 semanas · Prioridad: ALTA**

**Objetivo:** Centralizar todos los pedidos de cambio con trazabilidad completa.

**Tipos de solicitud disponibles según rol:**

| Tipo | Producer | Club Staff |
|------|----------|------------|
| Sumar cliente LIONS | ✅ | ❌ |
| Dar de baja cliente LIONS | ✅ | ❌ |
| Modificar minutos LIONS | ✅ | ❌ |
| Sumar cliente CLUB | ✅ | ✅ |
| Dar de baja cliente CLUB | ✅ | ✅ |
| Modificar minutos CLUB | ✅ | ✅ |
| Actualizar logo de marca | ✅ | ✅ |
| Nueva campaña | ✅ | ✅ |
| Animación personalizada | ✅ | ❌ |
| Error de render | ✅ | ❌ |
| Otro | ✅ | ✅ |

**Panel de solicitudes (Ajustes para Admin):**
```
SOLICITUDES PENDIENTES  [5 NUEVAS]

● URGENTE · add_client
  Sumar Latam Airlines 5'
  U. de Concepción · Hace 10 min · C. Rivas
  [✗ Rechazar]  [✓ Aprobar → ejecutar cambio]

● NORMAL · fix_render
  Error banner lateral "Sur"
  U. Católica · Hace 45 min · M. Santos
  [✗ Rechazar]  [✓ Aprobar]
```

**Log de operaciones:**
- Producers ven TODO el log (sin valores monetarios)
- Club staff ve solo las entradas de su club
- Admin ve todo

**Integración con Work Log:**
Cuando admin aprueba una solicitud de tipo:
- `add_client`, `update_minutes`, `fix_render`, `custom_animation`
→ Se auto-genera un draft de `work_entry` con el tipo correspondiente
→ Admin lo revisa, confirma o ajusta antes de guardar

**Lo que queda listo al finalizar Etapa 5:**
- ✅ Sistema completo de solicitudes con tipos y prioridades
- ✅ Flujo de aprobación para admins
- ✅ Log de operaciones filtrado por rol
- ✅ Auto-generación de work entries al aprobar
- ✅ Notificaciones básicas (email al aprobarse)

---

### ETAPA 6 — Sección Clientes (Ranking Global Mejorado)
**⏱ ~1-2 semanas · Prioridad: MEDIA**

**Objetivo:** Expandir el InvestorsView actual con filtros por liga, gráficos y la posibilidad de ver cada cliente en detalle.

**Funcionalidades:**
- Filtro: Global | Chile | Ecuador | Perú
- Sort: Por minutos totales | Por cantidad de clubes
- Gráfico horizontal de barras (Recharts) top 10
- Al hacer clic en un cliente → drawer con detalle por club y por liga
- Chips de clubes donde pauta con minutos

**Nota:** Esta sección solo visible para Admin y Producer. Club staff y Operators no ven esto.

**Lo que queda listo al finalizar Etapa 6:**
- ✅ Ranking con filtro por liga
- ✅ Gráfico visual de top clientes
- ✅ Detalle expandible por cliente
- ✅ Ocultado para club_staff y operator

---

### ETAPA 7 — Work Log (Registro de Trabajo Artístico)
**⏱ ~2 semanas · Prioridad: ALTA (para el equipo de arte)**

**Objetivo:** Sistema de tracking del trabajo artístico, solo visible para admins, con exportación mensual en formato compatible con la empresa.

**Funcionalidades:**

#### A) Registro de tareas
- Formulario con: tipo de tarea, club, partido (opcional), solicitud vinculada (opcional)
- Tipo de facturación: incluido / extra Lions / extra Club / extra Marca
- Valor neto en USD (solo visible para admins, encriptado en columna con RLS)
- Link Dropbox del entregable

#### B) Auto-generación
- Al aprobar una solicitud de tipo `custom_animation`, `fix_render`, etc. → draft automático
- Admin confirma o descarta

#### C) Log mensual
- Tabla por mes con todas las tareas
- Filtros: por mes, por club, por tipo, por estado de facturación
- Total del mes (sin markup)

#### D) Exportación Excel (.xlsx)
- Genera Excel con el formato exacto de los tabs mensuales actuales
- Columnas: fecha · club · partido · tipo · descripción · cobrar a · valor · ref. factura
- Compatible con la estructura que ya conoce la empresa que facturás

**Tipos precargados de la tarifación actual:**
- Partido Liga · Partido + Pixel Mapping
- Adaptaciones / Pack Adaptaciones
- Animación simple / compleja / con IA
- Ajuste de animación
- Creatividad (Guión / Premium)
- Diseño / Mockup / Montaje
- Edición (varios niveles)
- Bonificados (precio $0, tipo especial)

**Lo que queda listo al finalizar Etapa 7:**
- ✅ Tracking completo de trabajo artístico
- ✅ Auto-generación al aprobar solicitudes
- ✅ Precios visibles solo para admins (RLS garantizado)
- ✅ Exportación Excel mensual en formato conocido
- ✅ Historial de meses anteriores

---

### ETAPA 8 — Portales por Rol + Panel Personalizado Completo
**⏱ ~2-3 semanas · Prioridad: MEDIA**

**Objetivo:** Finalizar la personalización completa de cada panel según el rol logueado. Todos los roles ya están implementados pero se refinan aquí.

**Club Staff — refinamiento:**
- Al loguearse ven SOLO sus clientes CLUB (no los LIONS)
- No ven minutos de marcas competidoras
- Panel con: sus clientes, próximos partidos, playlists, sus solicitudes
- Logo del club prominente en el header
- Mensaje de bienvenida: "Hola, Staff Palestino"

**Operator — refinamiento:**
- Login limpio → van directo a su agenda
- Solo ven partidos de los clubes que les asignaron
- Descarga del package (Excel + material) con un clic
- No ven nada de comercial, clientes, ni solicitudes
- Vista ultra-simplificada: fecha · club · estado · [Descargar]

**Producer — refinamiento:**
- Panel completo con KPIs y alertas
- Acceso a todas las solicitudes (de todos los clubes, de todos los producers)
- Log completo sin precios
- No ven work log ni sección Ajustes completa

**Admin — refinamiento:**
- Todo lo anterior + sección Ajustes completa
- Work log y exportación
- Gestión de usuarios con roles

**Lo que queda listo al finalizar Etapa 8:**
- ✅ Experiencia completamente personalizada por rol
- ✅ Club staff ve solo su información
- ✅ Operators tienen vista minimalista de solo lo que necesitan
- ✅ Plataforma lista para onboarding de primeros clubes

---

### ETAPA 9 — API de Fútbol + Alertas Automáticas
**⏱ ~2-3 semanas · Prioridad: MEDIA**

**Objetivo:** Automatizar la carga del calendario de partidos y generar alertas comerciales inteligentes.

**API recomendada: API-Football (api-sports.io)**
- Free tier: 100 requests/día
- Chile liga: `id 265`, Ecuador: `id 240`, Perú: `id 345`
- Estrategia: Supabase Edge Function con cron diario a las 6AM → 3 requests (una por liga) → upsert en tabla `matches`

**Workaround TheSportsDB (más rápido de implementar):**
- Ya tienes `leagueId` y `tsdbTeamId` por equipo
- Hacer request por equipo en paralelo: `eventsnextteam.php?id=TEAM_ID`
- Para 16 equipos activos = 16 requests → dentro del free tier
- Cache de 4 horas para no repetir

**Alertas automáticas que se generan:**
- Partido en < 72hs + playlist no subida → urgente
- Partido en < 48hs + sin confirmación club → high
- Equipo con minutos disponibles + partido de alta audiencia (vs Colo-Colo, vs U. Chile) → opportunity
- Partido de local + 0 minutos disponibles → sold_out (info)
- Nueva solicitud + prioridad urgente → inmediata

**Lo que queda listo al finalizar Etapa 9:**
- ✅ Calendario auto-sincronizado sin trabajo manual
- ✅ Alertas inteligentes en tiempo real
- ✅ Cron job estable con Edge Functions
- ✅ Panel siempre actualizado sin intervención

---

### ETAPA 10 — Playlists Excel Automáticas (Análisis Primero)
**⏱ ~1 semana análisis + desarrollo TBD · Prioridad: BAJA hasta análisis**

**Objetivo:** Eventualmente generar el archivo Excel de playlist automáticamente desde los datos del sistema.

**Primer paso (antes de programar):**
Enviás los archivos Excel de ejemplo. Se analiza:
- Estructura de columnas y fórmulas
- Variaciones por club (ej: 15" vs 30" slots)
- Si hay fórmulas que dependen de datos externos
- Si se generan manualmente o desde una plantilla

**Opciones técnicas según lo que se encuentre:**
- Script Node.js + ExcelJS → genera .xlsx desde datos Supabase
- Python + openpyxl → más potente para fórmulas
- Google Apps Script → si trabajan en Sheets
- Trigger: cuando admin aprueba la confirmación del partido → se genera y sube automáticamente a Dropbox

---

## 📊 RESUMEN EJECUTIVO — TIEMPOS Y PRIORIDADES

| # | Etapa | Qué resuelve | Semanas | Prioridad |
|---|-------|-------------|---------|-----------|
| 0 | Correctivos | Bug de minutos, responsive, filtros Clientes | 1 | 🔴 Inmediata |
| 1 | Refactoring + 5 secciones | Código mantenible, bottom nav, React Router | 2 | 🔴 Crítica |
| 2 | Supabase auth + DB | Backend real, roles, registro | 2-3 | 🔴 Crítica |
| 3 | Panel por rol | Home personalizado, KPIs, alertas | 2 | 🔴 Alta |
| 4 | Agenda + confirmaciones | Flujo partidos, playlists, operators | 2-3 | 🔴 Alta |
| 5 | Solicitudes + Log | Pedidos de cambio, audit trail | 2-3 | 🔴 Alta |
| 6 | Clientes mejorado | Ranking global con filtros | 1-2 | 🟡 Media |
| 7 | Work Log | Tracking trabajo artístico, exportación | 2 | 🟠 Alta (arte) |
| 8 | Portales por rol | Refinamiento de cada experiencia | 2-3 | 🟡 Media |
| 9 | API + Alertas | Calendario automático | 2-3 | 🟡 Media |
| 10 | Playlists Excel | Generación automática (después de análisis) | TBD | ⚪ Futura |

**MVP para uso interno (Etapas 0-5):** ~13-15 semanas
**Plataforma completa con portales (Etapas 0-9):** ~22-25 semanas

---

## 🔑 DECISIONES TÉCNICAS CLAVE

### 1. Conservar lo que ya funciona
El App.jsx actual tiene piezas muy buenas: logos locales, LionsSVG, pills de marcas, drawer, TheSportsDB. El refactoring **extrae** estas piezas a archivos separados sin reescribirlas. Esto reduce el riesgo de romper algo que ya funciona.

### 2. Supabase > Firebase
PostgreSQL es relacional, perfecto para datos con relaciones complejas (clubes → clientes → partidos → playlists → confirmaciones). Row Level Security hace el trabajo de autorización en la base de datos, no en el código.

### 3. Magic Links para clubes y operators
El staff de los clubes NO quiere recordar contraseñas. Ingresan desde su email con un clic. Más seguro y más simple.

### 4. Bonificados como columna separada siempre
Los bonificados nunca se suman al estado del partido. Se muestran siempre como información adicional. Esta regla debe estar en `calcStats()` de forma inamovible.

### 5. Precios fuera del frontend
Los precios del work log viven en la DB y llegan solo cuando el rol es `admin`. Aunque alguien inspeccione el código JS compilado, no encontrará precios porque no están en el bundle — están en Supabase y Supabase los filtra por RLS.

### 6. Un link para operators
Los operators reciben UNA URL con el package completo (Excel playlist + todos los materiales). Este link es el Dropbox URL que admin sube al sistema. No hace falta que entiendan ningún sistema — solo abren su mail, ven la agenda, y descargan lo que necesitan.

---

## 📝 RESUMEN DE TODA LA CONVERSACIÓN

### El negocio
Lions Sports Media vende y gestiona **minutos de publicidad en el perímetro de canchas** (LEDs de estadio) en partidos de fútbol de Latinoamérica. Opera en Chile, Ecuador y Perú (2026). Los minutos se dividen en: gestionados por Lions (categoría LIONS), gestionados por el club (categoría CLUB), y bonificados (extras que se regalan pero no cuentan como vendidos).

### El equipo
- **Admin/Arte:** 2-3 personas (vos + socia) — tercerizado, producen playlists y animaciones, controlan todo, ven precios y facturación
- **Producers/Sellers:** ~5 personas — venden minutos, crean solicitudes, ven toda la info comercial
- **Club Staff:** Personal de cada club — ven sus propios datos, confirman partidos, piden cambios
- **Operators:** Técnicos de estadio — trabajan con varios clubes, solo necesitan descargar el material de cada partido

### La data actual
- 11 equipos activos en Chile + 4 futuros clientes
- 3 equipos en Ecuador
- 2 equipos activos + 2 vallas fijas en Perú
- Logos SVG locales organizados por país
- CSV completo con todos los clientes y minutos

### La plataforma que se está construyendo
Un centro de operaciones accesible desde cualquier dispositivo que permite: ver disponibilidad de minutos por partido, gestionar solicitudes de cambio, confirmar partidos y distribuir playlists, trackear trabajo artístico y facturación, y escalar a nuevos países y clubes fácilmente.

---

*Lions Sports Media · Plan Definitivo v3.0 · Mayo 2026*
*Documento consolidado de toda la sesión de diseño y planificación*
