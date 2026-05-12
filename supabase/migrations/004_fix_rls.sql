-- 004_fix_rls.sql
-- Fix: las políticas RLS de user_profiles generaban recursión infinita
-- porque consultaban la misma tabla que estaban protegiendo.
-- Solución: función SECURITY DEFINER que bypasea RLS.

-- 1. Crear función helper que bypasea RLS para obtener el rol
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Eliminar políticas problemáticas
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

-- 3. Recrear TODAS las políticas usando get_my_role() en vez de subquery

-- user_profiles
CREATE POLICY "Admin read all profiles" ON user_profiles FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin edit all profiles" ON user_profiles FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'admin');

-- countries & leagues
CREATE POLICY "Admin full countries" ON countries FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin full leagues" ON leagues FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- clubs
CREATE POLICY "Staff modify clubs" ON clubs FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin', 'producer'));

-- clients
CREATE POLICY "Read clients" ON clients FOR SELECT TO authenticated USING (
  public.get_my_role() IN ('admin', 'producer')
  OR club_id IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);
CREATE POLICY "Staff modify clients" ON clients FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin', 'producer'));

-- user_club_assignments
CREATE POLICY "Admin read all assignments" ON user_club_assignments FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');
CREATE POLICY "Admin edit all assignments" ON user_club_assignments FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin');

-- matches
CREATE POLICY "Staff modify matches" ON matches FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin', 'producer'));

-- match_events
CREATE POLICY "Read match events" ON match_events FOR SELECT TO authenticated USING (
  public.get_my_role() IN ('admin', 'producer')
  OR (SELECT home_club_id FROM matches WHERE id = match_id) IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);

-- requests
CREATE POLICY "Read requests" ON requests FOR SELECT TO authenticated USING (
  public.get_my_role() IN ('admin', 'producer')
  OR club_id IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);
CREATE POLICY "Staff modify requests" ON requests FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('admin', 'producer'));

-- work_entries
CREATE POLICY "Read work entries" ON work_entries FOR SELECT TO authenticated USING (
  public.get_my_role() = 'admin' OR worker_id = auth.uid()
);
CREATE POLICY "Update work entries" ON work_entries FOR UPDATE TO authenticated
  USING (worker_id = auth.uid() OR public.get_my_role() = 'admin');
