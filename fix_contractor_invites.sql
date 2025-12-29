-- ============================================
-- Corrigir convites criados incorretamente para o contratante
-- Remove convites onde o musician_id é igual ao contractor_id
-- ============================================

-- Deletar convites onde o músico é o próprio contratante
DELETE FROM invites
WHERE musician_id = contractor_id;

-- Verificar quantos foram removidos
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Removidos % convites onde o músico era o próprio contratante', v_count;
END $$;

-- ============================================
-- Verificar se ainda existem convites incorretos
-- ============================================
SELECT 
  COUNT(*) as total_incorrect_invites,
  COUNT(DISTINCT gig_id) as gigs_afetadas
FROM invites
WHERE musician_id = contractor_id;

