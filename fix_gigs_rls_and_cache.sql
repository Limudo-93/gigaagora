-- Script para corrigir problemas de criação de gigs
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Adicionar coluna 'cache' à tabela gig_roles (se não existir)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gig_roles' 
        AND column_name = 'cache'
    ) THEN
        ALTER TABLE gig_roles 
        ADD COLUMN cache NUMERIC(10, 2);
        
        COMMENT ON COLUMN gig_roles.cache IS 'Valor do cachê para esta vaga (role) em reais';
    END IF;
END $$;

-- ============================================
-- 2. Remover políticas RLS antigas que podem estar bloqueando
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own gigs" ON gigs;
DROP POLICY IF EXISTS "Users can view their own gigs" ON gigs;
DROP POLICY IF EXISTS "Users can update their own gigs" ON gigs;
DROP POLICY IF EXISTS "Users can delete their own gigs" ON gigs;

DROP POLICY IF EXISTS "Users can insert roles for their own gigs" ON gig_roles;
DROP POLICY IF EXISTS "Users can view roles of their own gigs" ON gig_roles;
DROP POLICY IF EXISTS "Users can update roles of their own gigs" ON gig_roles;
DROP POLICY IF EXISTS "Users can delete roles of their own gigs" ON gig_roles;

-- ============================================
-- 3. Criar novas políticas RLS para gigs
-- Todos os usuários autenticados podem criar gigs (não há mais distinção de tipo)
-- ============================================

-- Habilitar RLS na tabela gigs (se ainda não estiver habilitado)
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

-- Política para INSERT: qualquer usuário autenticado pode criar gigs
CREATE POLICY "Authenticated users can insert gigs"
ON gigs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = contractor_id);

-- Política para SELECT: usuários podem ver gigs onde são o contractor
CREATE POLICY "Users can view their own gigs"
ON gigs
FOR SELECT
TO authenticated
USING (auth.uid() = contractor_id);

-- Política para SELECT: músicos podem ver gigs onde receberam convites
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

-- Política para SELECT: usuários podem ver gigs publicadas (para busca)
CREATE POLICY "Users can view published gigs"
ON gigs
FOR SELECT
TO authenticated
USING (status = 'published');

-- Política para UPDATE: usuários podem atualizar gigs onde são o contractor
CREATE POLICY "Users can update their own gigs"
ON gigs
FOR UPDATE
TO authenticated
USING (auth.uid() = contractor_id)
WITH CHECK (auth.uid() = contractor_id);

-- Política para DELETE: usuários podem deletar gigs onde são o contractor
CREATE POLICY "Users can delete their own gigs"
ON gigs
FOR DELETE
TO authenticated
USING (auth.uid() = contractor_id);

-- ============================================
-- 4. Criar novas políticas RLS para gig_roles
-- ============================================

-- Habilitar RLS na tabela gig_roles (se ainda não estiver habilitado)
ALTER TABLE gig_roles ENABLE ROW LEVEL SECURITY;

-- Política para INSERT em gig_roles: usuários podem criar roles para suas próprias gigs
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

-- Política para SELECT em gig_roles: usuários podem ver roles de suas próprias gigs
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

-- Política para SELECT em gig_roles: músicos podem ver roles de gigs onde receberam convites
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

-- Política para SELECT em gig_roles: usuários podem ver roles de gigs publicadas
CREATE POLICY "Users can view roles of published gigs"
ON gig_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM gigs
    WHERE gigs.id = gig_roles.gig_id
    AND gigs.status = 'published'
  )
);

-- Política para UPDATE em gig_roles: usuários podem atualizar roles de suas próprias gigs
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

-- Política para DELETE em gig_roles: usuários podem deletar roles de suas próprias gigs
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

-- ============================================
-- 5. Verificar se as políticas foram criadas
-- ============================================
-- Execute estas queries para verificar:
-- SELECT * FROM pg_policies WHERE tablename = 'gigs';
-- SELECT * FROM pg_policies WHERE tablename = 'gig_roles';

