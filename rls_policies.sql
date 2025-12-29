-- Políticas RLS (Row Level Security) para a tabela gigs
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar RLS na tabela gigs (se ainda não estiver habilitado)
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

-- 2. Política para INSERT: usuários autenticados podem criar gigs onde são o contractor
CREATE POLICY "Users can insert their own gigs"
ON gigs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = contractor_id);

-- 3. Política para SELECT: usuários podem ver gigs onde são o contractor
CREATE POLICY "Users can view their own gigs"
ON gigs
FOR SELECT
TO authenticated
USING (auth.uid() = contractor_id);

-- 3b. Política para SELECT: músicos podem ver gigs onde receberam convites
CREATE POLICY "Musicians can view gigs they were invited to"
ON gigs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invites
    WHERE invites.gig_id = gigs.id
    AND invites.musician_id = auth.uid()
  )
);

-- 4. Política para UPDATE: usuários podem atualizar gigs onde são o contractor
CREATE POLICY "Users can update their own gigs"
ON gigs
FOR UPDATE
TO authenticated
USING (auth.uid() = contractor_id)
WITH CHECK (auth.uid() = contractor_id);

-- 5. Política para DELETE: usuários podem deletar gigs onde são o contractor
CREATE POLICY "Users can delete their own gigs"
ON gigs
FOR DELETE
TO authenticated
USING (auth.uid() = contractor_id);

-- 6. Habilitar RLS na tabela gig_roles (se ainda não estiver habilitado)
ALTER TABLE gig_roles ENABLE ROW LEVEL SECURITY;

-- 7. Política para INSERT em gig_roles: usuários podem criar roles para suas próprias gigs
CREATE POLICY "Users can insert roles for their own gigs"
ON gig_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = gig_roles.gig_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- 8. Política para SELECT em gig_roles: usuários podem ver roles de suas próprias gigs
CREATE POLICY "Users can view roles of their own gigs"
ON gig_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = gig_roles.gig_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- 8b. Política para SELECT em gig_roles: músicos podem ver roles de gigs onde receberam convites
CREATE POLICY "Musicians can view roles of gigs they were invited to"
ON gig_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invites
    WHERE invites.gig_role_id = gig_roles.id
    AND invites.musician_id = auth.uid()
  )
);

-- 9. Política para UPDATE em gig_roles: usuários podem atualizar roles de suas próprias gigs
CREATE POLICY "Users can update roles of their own gigs"
ON gig_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = gig_roles.gig_id
    AND gigs.contractor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = gig_roles.gig_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- 10. Política para DELETE em gig_roles: usuários podem deletar roles de suas próprias gigs
CREATE POLICY "Users can delete roles of their own gigs"
ON gig_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = gig_roles.gig_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- 11. Habilitar RLS na tabela invites (se ainda não estiver habilitado)
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- 12. Política para SELECT: músicos podem ver seus próprios convites
CREATE POLICY "Musicians can view their own invites"
ON invites
FOR SELECT
TO authenticated
USING (auth.uid() = musician_id);

-- 13. Política para SELECT: contractors podem ver convites de suas próprias gigs
CREATE POLICY "Contractors can view invites for their gigs"
ON invites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = invites.gig_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- 14. Política para INSERT: contractors podem criar convites para suas próprias gigs
CREATE POLICY "Contractors can create invites for their gigs"
ON invites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = invites.gig_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- 15. Política para UPDATE: músicos podem atualizar seus próprios convites (aceitar/recusar)
CREATE POLICY "Musicians can update their own invites"
ON invites
FOR UPDATE
TO authenticated
USING (auth.uid() = musician_id)
WITH CHECK (auth.uid() = musician_id);

-- 16. Política para UPDATE: contractors podem atualizar convites de suas próprias gigs (cancelar)
CREATE POLICY "Contractors can update invites for their gigs"
ON invites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = invites.gig_id
    AND gigs.contractor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = invites.gig_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- Nota: Se você já tiver políticas existentes que conflitam, você pode precisar removê-las primeiro:
-- DROP POLICY IF EXISTS "nome_da_politica" ON gigs;
-- DROP POLICY IF EXISTS "nome_da_politica" ON gig_roles;
-- DROP POLICY IF EXISTS "nome_da_politica" ON invites;

