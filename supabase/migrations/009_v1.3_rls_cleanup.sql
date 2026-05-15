-- CLEANUP: Remove duplicate/conflicting RLS policies
-- The original 003_rls.sql created policies using subqueries like:
--   (SELECT role FROM user_profiles WHERE id = auth.uid())
-- The 004_fix_rls.sql recreated them using get_my_role() but
-- did NOT drop the original "Public read" policies from 003.
-- This causes "Multiple Permissive Policies" warnings in Supabase Advisor.
--
-- Run this ONCE in Supabase SQL Editor to clean up.

-- Drop the original 003 "Public read" policies (they use subqueries)
DROP POLICY IF EXISTS "Public read countries" ON countries;
DROP POLICY IF EXISTS "Public read leagues" ON leagues;
DROP POLICY IF EXISTS "Public read clubs" ON clubs;
DROP POLICY IF EXISTS "Public read matches" ON matches;

-- Drop the original 003 profile policies (replaced by 004)
DROP POLICY IF EXISTS "Read own profile" ON user_profiles;

-- Drop the original 003 assignment policies (replaced by 004)
DROP POLICY IF EXISTS "Read own assignments" ON user_club_assignments;

-- Drop the original 003 match event insert policy (keep the read one from 004)
DROP POLICY IF EXISTS "Insert match events" ON match_events;

-- Drop the original 003 request insert policy
DROP POLICY IF EXISTS "Insert requests" ON requests;

-- Drop the original 003 work entry insert policy
DROP POLICY IF EXISTS "Insert work entries" ON work_entries;

-- Now recreate the NECESSARY broad read + insert policies using get_my_role()

-- Everyone authenticated can READ countries, leagues, clubs, matches
-- (These are reference data, not sensitive)
CREATE POLICY "Authenticated read countries" ON countries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read leagues" ON leagues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read clubs" ON clubs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read matches" ON matches
  FOR SELECT TO authenticated USING (true);

-- Users can read their own profile
CREATE POLICY "Read own profile" ON user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Users can read their own club assignments
CREATE POLICY "Read own assignments" ON user_club_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Any authenticated user can insert match events (for confirmations)
CREATE POLICY "Insert match events" ON match_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- Any authenticated user can insert requests
CREATE POLICY "Insert requests" ON requests
  FOR INSERT TO authenticated WITH CHECK (true);

-- Workers can insert their own work entries
CREATE POLICY "Insert work entries" ON work_entries
  FOR INSERT TO authenticated WITH CHECK (worker_id = auth.uid());

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
