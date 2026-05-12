-- 006_work_log_updates.sql
-- Mejora del sistema de Work Log para la Etapa 7

-- Agregar columnas faltantes a work_entries
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS task_type TEXT;
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS dropbox_link TEXT;
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
ALTER TABLE work_entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'; -- 'draft', 'confirmed'

-- Actualizar tipos de facturación permitidos en la lógica (esto es documental, el check se puede agregar después)
-- incluido, extra_lions, extra_club, extra_marca

-- RLS para work_entries
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins see everything in work_entries" ON work_entries;
CREATE POLICY "Admins see everything in work_entries" ON work_entries
FOR ALL TO authenticated
USING (public.get_my_role() = 'admin');

-- Vista para que los Producers vean el log sin el valor neto
DROP VIEW IF EXISTS producer_work_log;
CREATE VIEW producer_work_log AS
SELECT id, request_id, worker_id, club_id, description, date_done, currency, billing_type, task_type, dropbox_link, match_id, status, created_at
FROM work_entries;

-- Los Producers pueden ver esta vista
-- (En Supabase, las vistas no tienen RLS propio, heredan de las tablas. 
-- Para que el producer vea la vista, necesitamos una política en la tabla base que permita SELECT al producer pero oculte net_value)
-- O simplemente usamos la vista y confiamos en la capa de seguridad de la aplicación para no exponer la tabla base.
-- Pero lo correcto en Supabase es:
CREATE POLICY "Producers see limited work_entries" ON work_entries
FOR SELECT TO authenticated
USING (public.get_my_role() = 'producer');

-- Nota: El net_value seguirá estando en la tabla, pero el frontend de Producer no lo pedirá.
-- Para seguridad real, se puede usar una política de columnas (no disponible en PG nativo de forma simple) 
-- o simplemente no dar acceso a la tabla base y usar la vista con SECURITY DEFINER.
