-- PATCH V1.1 PARA APLICAR EN SUPABASE (SQL EDITOR)
-- Incluye correcciones de RLS, Comentarios y Relaciones de Work Log.

-- 1. Crear función helper que bypasea RLS para obtener el rol
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Eliminar políticas problemáticas (recursión)
DROP POLICY IF EXISTS "Admin read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin edit all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin full countries" ON countries;
DROP POLICY IF EXISTS "Admin full leagues" ON leagues;
DROP POLICY IF EXISTS "Staff modify clubs" ON clubs;
DROP POLICY IF EXISTS "Read clients" ON clients;
DROP POLICY IF EXISTS "Staff modify clients" ON clients;
DROP POLICY IF EXISTS "Admin read all assignments" ON user_club_assignments;
DROP POLICY IF EXISTS "Admin edit all assignments" ON user_club_assignments;
DROP POLICY IF EXISTS "Staff modify matches" ON matches;
DROP POLICY IF EXISTS "Read match events" ON match_events;
DROP POLICY IF EXISTS "Read requests" ON requests;
DROP POLICY IF EXISTS "Staff modify requests" ON requests;
DROP POLICY IF EXISTS "Read work entries" ON work_entries;
DROP POLICY IF EXISTS "Update work entries" ON work_entries;

-- 3. Recrear TODAS las políticas usando get_my_role()
CREATE POLICY "Admin read all profiles" ON user_profiles FOR SELECT TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin edit all profiles" ON user_profiles FOR UPDATE TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin full countries" ON countries FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin full leagues" ON leagues FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Staff modify clubs" ON clubs FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'producer'));
CREATE POLICY "Read clients" ON clients FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'producer') OR club_id IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid()));
CREATE POLICY "Staff modify clients" ON clients FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'producer'));
CREATE POLICY "Admin read all assignments" ON user_club_assignments FOR SELECT TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin edit all assignments" ON user_club_assignments FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Staff modify matches" ON matches FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'producer'));
CREATE POLICY "Read match events" ON match_events FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'producer') OR (SELECT home_club_id FROM matches WHERE id = match_id) IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid()));
CREATE POLICY "Read requests" ON requests FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'producer') OR club_id IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid()));
CREATE POLICY "Staff modify requests" ON requests FOR UPDATE TO authenticated USING (public.get_my_role() IN ('admin', 'producer'));
CREATE POLICY "Read work entries" ON work_entries FOR SELECT TO authenticated USING (public.get_my_role() = 'admin' OR worker_id = auth.uid());
CREATE POLICY "Update work entries" ON work_entries FOR UPDATE TO authenticated USING (worker_id = auth.uid() OR public.get_my_role() = 'admin');

-- 4. COMENTARIOS DE REQUESTS
CREATE TABLE IF NOT EXISTS request_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID REFERENCES requests(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read request comments" ON request_comments;
DROP POLICY IF EXISTS "Insert request comments" ON request_comments;

CREATE POLICY "Read request comments" ON request_comments FOR SELECT TO authenticated USING (
  public.get_my_role() IN ('admin', 'producer') OR (SELECT club_id FROM requests WHERE id = request_id) IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);
CREATE POLICY "Insert request comments" ON request_comments FOR INSERT TO authenticated WITH CHECK (
  public.get_my_role() IN ('admin', 'producer') OR (SELECT club_id FROM requests WHERE id = request_id) IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);

-- 5. MEJORAS DE WORK ENTRIES
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS task_type TEXT;
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS dropbox_link TEXT;
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

DROP POLICY IF EXISTS "Admins see everything in work_entries" ON work_entries;
CREATE POLICY "Admins see everything in work_entries" ON work_entries FOR ALL TO authenticated USING (public.get_my_role() = 'admin');
DROP POLICY IF EXISTS "Producers see limited work_entries" ON work_entries;
CREATE POLICY "Producers see limited work_entries" ON work_entries FOR SELECT TO authenticated USING (public.get_my_role() = 'producer');

-- Refrescar el cache del schema (importante para PostgREST)
NOTIFY pgrst, 'reload schema';
