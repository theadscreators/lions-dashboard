-- 003_rls.sql
-- Activar Row Level Security (RLS) en todas las tablas

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_club_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- Helpers
-- CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
--  SELECT role FROM user_profiles WHERE id = auth.uid();
-- $$ LANGUAGE sql SECURITY DEFINER;

-- 1. countries & leagues
-- Todos (autenticados) pueden ver. Solo admins pueden modificar.
CREATE POLICY "Public read countries" ON countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full countries" ON countries FOR ALL TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Public read leagues" ON leagues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full leagues" ON leagues FOR ALL TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- 2. clubs
-- Todos pueden ver. Solo admin y producer pueden editar.
CREATE POLICY "Public read clubs" ON clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff modify clubs" ON clubs FOR ALL TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer'));

-- 3. clients
-- Admin y producer ven todos.
-- Club staff solo ve los clientes de su club (a través de user_club_assignments).
CREATE POLICY "Read clients" ON clients FOR SELECT TO authenticated USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer')
  OR 
  club_id IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);
CREATE POLICY "Staff modify clients" ON clients FOR ALL TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer'));

-- 4. user_profiles
-- Un usuario puede ver su propio perfil.
-- Admin ve todos.
CREATE POLICY "Read own profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin read all profiles" ON user_profiles FOR SELECT TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin edit all profiles" ON user_profiles FOR ALL TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- 5. user_club_assignments
-- Usuario ve sus propias asignaciones. Admin ve todas.
CREATE POLICY "Read own assignments" ON user_club_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin read all assignments" ON user_club_assignments FOR SELECT TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin edit all assignments" ON user_club_assignments FOR ALL TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- 6. matches
-- Todos pueden ver los partidos (para que club staff vea el próximo).
CREATE POLICY "Public read matches" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff modify matches" ON matches FOR ALL TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer'));

-- 7. match_events
-- Operators y Club Staff ven los eventos que pertenecen a los clubes asignados a ellos.
-- Admin y producer ven todo.
CREATE POLICY "Read match events" ON match_events FOR SELECT TO authenticated USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer')
  OR
  (SELECT home_club_id FROM matches WHERE id = match_id) IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);
-- Para insertar: cualquiera autenticado puede insertar (para que Club staff pueda confirmar)
CREATE POLICY "Insert match events" ON match_events FOR INSERT TO authenticated WITH CHECK (true);

-- 8. requests
-- Admin/Producer ven/editan todas.
-- Club Staff ve sus propias (creadas por ellos o asignadas a su club).
CREATE POLICY "Read requests" ON requests FOR SELECT TO authenticated USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer')
  OR 
  club_id IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);
CREATE POLICY "Insert requests" ON requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff modify requests" ON requests FOR UPDATE TO authenticated USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'producer'));

-- 9. work_entries
-- Admin ve todo. Producer ve sus propios trabajos.
CREATE POLICY "Read work entries" ON work_entries FOR SELECT TO authenticated USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  OR worker_id = auth.uid()
);
CREATE POLICY "Insert work entries" ON work_entries FOR INSERT TO authenticated WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Update work entries" ON work_entries FOR UPDATE TO authenticated USING (worker_id = auth.uid() OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
