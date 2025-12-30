-- ============================================
-- CORREÇÃO: Gigs não aparecem e músicos confirmados não aparecem
-- ============================================

-- ============================================
-- 1. CRIAR função RPC para listar músicos CONFIRMADOS
-- ============================================

CREATE OR REPLACE FUNCTION rpc_list_confirmed_musicians_for_gig(p_gig_id UUID)
RETURNS TABLE (
  invite_id UUID,
  musician_id UUID,
  musician_name TEXT,
  musician_photo_url TEXT,
  instrument TEXT,
  gig_role_id UUID,
  confirmed_at TIMESTAMPTZ,
  avg_rating NUMERIC,
  rating_count INTEGER,
  city TEXT,
  state TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as invite_id,
    i.musician_id,
    p.display_name as musician_name,
    p.photo_url as musician_photo_url,
    gr.instrument,
    i.gig_role_id,
    c.confirmed_at,
    mp.avg_rating,
    mp.rating_count,
    p.city,
    p.state
  FROM confirmations c
  INNER JOIN invites i ON i.id = c.invite_id
  INNER JOIN gig_roles gr ON gr.id = i.gig_role_id
  INNER JOIN profiles p ON p.user_id = i.musician_id
  LEFT JOIN musician_profiles mp ON mp.user_id = i.musician_id
  WHERE 
    i.gig_id = p_gig_id
    AND c.confirmed = true
  ORDER BY c.confirmed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION rpc_list_confirmed_musicians_for_gig(UUID) TO authenticated, anon;

-- Comentário
COMMENT ON FUNCTION rpc_list_confirmed_musicians_for_gig(UUID) IS 'Lista apenas os músicos CONFIRMADOS para uma gig específica (com confirmed = true)';

-- ============================================
-- 2. VERIFICAR e corrigir RLS da tabela gigs
-- ============================================

-- Verificar se RLS está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'gigs'
  ) THEN
    RAISE NOTICE 'Tabela gigs não existe';
  ELSE
    -- Habilitar RLS se não estiver
    ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
    
    -- Verificar se existe política para SELECT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'gigs' 
      AND policyname = 'Users can view published gigs'
    ) THEN
      -- Criar política para permitir visualizar gigs publicadas
      CREATE POLICY "Users can view published gigs"
        ON gigs FOR SELECT
        TO authenticated
        USING (status = 'published' OR contractor_id = auth.uid());
    END IF;
    
    -- Verificar se existe política para contratantes verem suas próprias gigs
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'gigs' 
      AND policyname = 'Contractors can view their own gigs'
    ) THEN
      CREATE POLICY "Contractors can view their own gigs"
        ON gigs FOR SELECT
        TO authenticated
        USING (contractor_id = auth.uid());
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. VERIFICAR e corrigir RLS da tabela confirmations
-- ============================================

-- Habilitar RLS se não estiver
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;

-- Política para contratantes verem confirmações de suas gigs
DROP POLICY IF EXISTS "Contractors can view confirmations for their gigs" ON confirmations;
CREATE POLICY "Contractors can view confirmations for their gigs"
  ON confirmations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invites i
      INNER JOIN gigs g ON g.id = i.gig_id
      WHERE i.id = confirmations.invite_id
      AND g.contractor_id = auth.uid()
    )
  );

-- Política para músicos verem suas próprias confirmações
DROP POLICY IF EXISTS "Musicians can view their own confirmations" ON confirmations;
CREATE POLICY "Musicians can view their own confirmations"
  ON confirmations FOR SELECT
  TO authenticated
  USING (musician_id = auth.uid());

-- ============================================
-- 4. VERIFICAÇÕES
-- ============================================

-- Verificar funções criadas
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('rpc_list_confirmed_musicians_for_gig', 'rpc_list_accepted_musicians_for_gig')
ORDER BY proname;

-- Verificar políticas RLS da tabela gigs
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'gigs'
ORDER BY cmd, policyname;

-- Verificar políticas RLS da tabela confirmations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'confirmations'
ORDER BY cmd, policyname;

