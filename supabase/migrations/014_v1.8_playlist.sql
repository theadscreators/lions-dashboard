-- V1.8 Add Match Playlist and Round Name
ALTER TABLE matches ADD COLUMN IF NOT EXISTS playlist_url TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_name TEXT;
