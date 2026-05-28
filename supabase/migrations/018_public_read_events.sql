-- Migration: 018_public_read_events.sql
-- Description: Allow public anonymous read-only access to match_events for guest agenda view.

DROP POLICY IF EXISTS "Public anonymous read match_events" ON match_events;
CREATE POLICY "Public anonymous read match_events" ON match_events
  FOR SELECT TO public USING (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
