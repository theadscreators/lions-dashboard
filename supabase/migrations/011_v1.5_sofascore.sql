-- V1.5_Sofascore_Integration.sql
-- Add Sofascore IDs to leagues and clubs for synchronization

-- 1. Leagues: Add sofascore_id
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS sofascore_id INT;

-- 2. Clubs: Add sofascore_id
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS sofascore_id INT;

-- 3. Matches: Ensure stadium_name exists (operational_notes already exists)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stadium_name TEXT;

-- 4. Set current Sofascore IDs for existing leagues
UPDATE leagues SET sofascore_id = 325 WHERE api_id = 265; -- Chile
UPDATE leagues SET sofascore_id = 367 WHERE api_id = 240; -- Ecuador
UPDATE leagues SET sofascore_id = 341 WHERE api_id = 345; -- Peru

NOTIFY pgrst, 'reload schema';
