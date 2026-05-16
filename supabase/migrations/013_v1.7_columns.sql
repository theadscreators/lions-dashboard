-- V1.7 Update Matches columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_name TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_logo TEXT;
