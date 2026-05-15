-- V1.6_FotMob_Integration.sql
-- Add FotMob IDs to leagues and clubs

-- 1. Add columns if they don't exist
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS fotmob_id INT UNIQUE;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS fotmob_id INT UNIQUE;

-- 2. Update League IDs based on user discovery
UPDATE leagues SET fotmob_id = 273 WHERE name ILIKE '%Chile%' AND name NOT ILIKE '%Copa%';
UPDATE leagues SET fotmob_id = 246 WHERE name ILIKE '%Ecuador%';
UPDATE leagues SET fotmob_id = 131 WHERE name ILIKE '%Perú%';

-- 3. Add countries and specific leagues if they don't exist
INSERT INTO countries (name, code, flag_emoji, active)
VALUES ('Paraguay', 'py', '🇵🇾', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO leagues (country_id, name, fotmob_id, active)
SELECT id, 'Copa Chile', 11697, true
FROM countries 
WHERE code = 'cl'
ON CONFLICT (fotmob_id) DO UPDATE SET active = true;

INSERT INTO leagues (country_id, name, fotmob_id, active)
SELECT id, 'Primera División', 199, true
FROM countries 
WHERE code = 'py'
ON CONFLICT (fotmob_id) DO UPDATE SET active = true;

NOTIFY pgrst, 'reload schema';
