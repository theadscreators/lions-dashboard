-- V1.9 Add Match Pauta Override
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pauta_override TEXT DEFAULT 'default';
