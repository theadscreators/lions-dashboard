-- 005_request_comments.sql
-- Añade soporte para comentarios en los tickets (requests)

CREATE TABLE request_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID REFERENCES requests(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura
-- Un usuario puede ver los comentarios si puede ver el request correspondiente
CREATE POLICY "Read request comments" ON request_comments FOR SELECT TO authenticated USING (
  public.get_my_role() IN ('admin', 'producer')
  OR (SELECT club_id FROM requests WHERE id = request_id) IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);

-- Políticas de inserción
-- Cualquier usuario autenticado puede comentar en un request que puede ver
CREATE POLICY "Insert request comments" ON request_comments FOR INSERT TO authenticated WITH CHECK (
  public.get_my_role() IN ('admin', 'producer')
  OR (SELECT club_id FROM requests WHERE id = request_id) IN (SELECT club_id FROM user_club_assignments WHERE user_id = auth.uid())
);
