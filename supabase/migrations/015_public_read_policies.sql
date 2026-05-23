-- Migration: 015_public_read_policies.sql
-- Description: Allow public (anonymous + authenticated) read-only access to countries, leagues, clubs, clients, and matches.
-- This enables direct sharing of pauta reports without login.

DROP POLICY IF EXISTS "Public anonymous read matches" ON matches;
CREATE POLICY "Public anonymous read matches" ON matches
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public anonymous read clubs" ON clubs;
CREATE POLICY "Public anonymous read clubs" ON clubs
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public anonymous read clients" ON clients;
CREATE POLICY "Public anonymous read clients" ON clients
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public anonymous read leagues" ON leagues;
CREATE POLICY "Public anonymous read leagues" ON leagues
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public anonymous read countries" ON countries;
CREATE POLICY "Public anonymous read countries" ON countries
  FOR SELECT TO public USING (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
