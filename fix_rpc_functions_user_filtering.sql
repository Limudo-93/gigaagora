-- ============================================
-- Corrigir funções RPC para filtrar corretamente por usuário
-- Garantir que cada usuário veja apenas seus próprios dados
-- ============================================

-- Remover funções existentes antes de recriar
DROP FUNCTION IF EXISTS rpc_list_pending_invites();
DROP FUNCTION IF EXISTS rpc_list_upcoming_confirmed_gigs();

-- Função RPC para listar convites pendentes do usuário logado
CREATE OR REPLACE FUNCTION rpc_list_pending_invites()
RETURNS TABLE (
  invite_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  gig_id UUID,
  gig_title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location_name TEXT,
  address_text TEXT,
  city TEXT,
  state TEXT,
  instrument TEXT,
  flyer_url TEXT,
  contractor_name TEXT,
  cache NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as invite_id,
    i.status::TEXT,
    i.created_at,
    g.id as gig_id,
    g.title as gig_title,
    g.start_time,
    g.end_time,
    g.location_name,
    g.address_text,
    g.city,
    g.state,
    gr.instrument,
    g.flyer_url,
    p.display_name as contractor_name,
    gr.cache
  FROM invites i
  INNER JOIN gigs g ON g.id = i.gig_id
  INNER JOIN gig_roles gr ON gr.id = i.gig_role_id
  LEFT JOIN profiles p ON p.user_id = g.contractor_id
  WHERE 
    i.musician_id = auth.uid()  -- Apenas convites do usuário logado
    AND i.status = 'pending'
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função RPC para listar gigs confirmadas futuras do usuário logado
CREATE OR REPLACE FUNCTION rpc_list_upcoming_confirmed_gigs()
RETURNS TABLE (
  confirmation_id UUID,
  invite_id UUID,
  created_at TIMESTAMPTZ,
  gig_id UUID,
  gig_title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location_name TEXT,
  address_text TEXT,
  city TEXT,
  state TEXT,
  instrument TEXT,
  flyer_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as confirmation_id,
    i.id as invite_id,
    c.created_at,
    g.id as gig_id,
    g.title as gig_title,
    g.start_time,
    g.end_time,
    g.location_name,
    g.address_text,
    g.city,
    g.state,
    gr.instrument,
    g.flyer_url
  FROM confirmations c
  INNER JOIN invites i ON i.id = c.invite_id
  INNER JOIN gigs g ON g.id = i.gig_id
  INNER JOIN gig_roles gr ON gr.id = i.gig_role_id
  WHERE 
    i.musician_id = auth.uid()  -- Apenas confirmações do usuário logado
    AND g.start_time >= NOW()  -- Apenas gigs futuras
  ORDER BY g.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comentários para documentação
-- ============================================
COMMENT ON FUNCTION rpc_list_pending_invites() IS 'Lista convites pendentes do usuário logado (músico). Filtra automaticamente por auth.uid().';
COMMENT ON FUNCTION rpc_list_upcoming_confirmed_gigs() IS 'Lista gigs confirmadas futuras do usuário logado (músico). Filtra automaticamente por auth.uid().';

