-- V1.2_Agenda.sql
-- Este parche agrega las columnas necesarias para las Notas Operativas (Goles, Kickoffs, etc)
-- a la tabla de partidos.

-- 1. Agregar columna para notas operativas
ALTER TABLE matches ADD COLUMN IF NOT EXISTS operational_notes TEXT;

-- 2. Asegurarse de que el status también permita estados de sobreventa o notas rápidas
-- (Esto es opcional si solo usamos texto, pero es buena práctica refrescar el schema cache)

NOTIFY pgrst, 'reload schema';
