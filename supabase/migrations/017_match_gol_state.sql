-- V1.10 Add Match Gol Pauta columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS gol_brand TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS gol_notes TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pauta_override TEXT DEFAULT 'default';
