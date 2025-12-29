-- Script para corrigir políticas RLS da tabela confirmations
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Habilitar RLS na tabela confirmations (se ainda não estiver habilitado)
-- ============================================
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Remover políticas antigas (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Contractors can create confirmations for their gigs" ON confirmations;
DROP POLICY IF EXISTS "Musicians can view their own confirmations" ON confirmations;
DROP POLICY IF EXISTS "Contractors can view confirmations for their gigs" ON confirmations;
DROP POLICY IF EXISTS "Musicians can delete their own confirmations" ON confirmations;
DROP POLICY IF EXISTS "Contractors can delete confirmations for their gigs" ON confirmations;

-- ============================================
-- 3. Criar novas políticas RLS para confirmations
-- ============================================

-- Política para INSERT: contratantes podem criar confirmações para invites de suas próprias gigs
CREATE POLICY "Contractors can create confirmations for their gigs"
ON confirmations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invites
    INNER JOIN gigs ON gigs.id = invites.gig_id
    WHERE invites.id = confirmations.invite_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- Política para SELECT: músicos podem ver suas próprias confirmações
CREATE POLICY "Musicians can view their own confirmations"
ON confirmations
FOR SELECT
TO authenticated
USING (auth.uid() = musician_id);

-- Política para SELECT: contratantes podem ver confirmações de suas próprias gigs
CREATE POLICY "Contractors can view confirmations for their gigs"
ON confirmations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invites
    INNER JOIN gigs ON gigs.id = invites.gig_id
    WHERE invites.id = confirmations.invite_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- Política para DELETE: músicos podem deletar suas próprias confirmações
CREATE POLICY "Musicians can delete their own confirmations"
ON confirmations
FOR DELETE
TO authenticated
USING (auth.uid() = musician_id);

-- Política para DELETE: contratantes podem deletar confirmações de suas próprias gigs
CREATE POLICY "Contractors can delete confirmations for their gigs"
ON confirmations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invites
    INNER JOIN gigs ON gigs.id = invites.gig_id
    WHERE invites.id = confirmations.invite_id
    AND gigs.contractor_id = auth.uid()
  )
);

-- ============================================
-- Verificação
-- ============================================
-- Lista as políticas criadas
SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  CASE 
    WHEN qual IS NOT NULL THEN qual::text
    ELSE 'N/A'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN with_check::text
    ELSE 'N/A'
  END as "WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'confirmations'
ORDER BY policyname;

