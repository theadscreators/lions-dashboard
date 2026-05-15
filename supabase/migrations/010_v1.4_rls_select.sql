-- V1.4_RLS_Select.sql
-- Grant SELECT permissions to authenticated users for requests and work entries.
-- This fixes the issue where users couldn't see the requests they created.

-- Requests: All authenticated users can read all requests (for collaboration)
DROP POLICY IF EXISTS "Authenticated read requests" ON requests;
CREATE POLICY "Authenticated read requests" ON requests
  FOR SELECT TO authenticated USING (true);

-- Request Comments: All authenticated users can read comments
DROP POLICY IF EXISTS "Authenticated read request comments" ON request_comments;
CREATE POLICY "Authenticated read request comments" ON request_comments
  FOR SELECT TO authenticated USING (true);

-- Work Entries (LOG): Admin and Producers can read ALL entries.
-- Operators and Club Staff might only need to see their own, 
-- but for now let's allow all authenticated to read (per current UI design).
DROP POLICY IF EXISTS "Authenticated read work entries" ON work_entries;
CREATE POLICY "Authenticated read work entries" ON work_entries
  FOR SELECT TO authenticated USING (true);

-- User Profiles: Make sure we can see all profiles (needed for joins in requests)
DROP POLICY IF EXISTS "Authenticated read all profiles" ON user_profiles;
CREATE POLICY "Authenticated read all profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
