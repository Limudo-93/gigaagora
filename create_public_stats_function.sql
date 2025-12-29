-- Função RPC pública para obter estatísticas da homepage
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- Função para obter estatísticas públicas
-- ============================================
CREATE OR REPLACE FUNCTION rpc_get_public_stats()
RETURNS JSON AS $$
DECLARE
  v_total_users INTEGER;
  v_total_gigs INTEGER;
  v_total_cache NUMERIC;
BEGIN
  -- Total de usuários (perfis)
  SELECT COUNT(*) INTO v_total_users
  FROM profiles;

  -- Total de gigs publicadas
  SELECT COUNT(*) INTO v_total_gigs
  FROM gigs
  WHERE status = 'published';

  -- Total de cachê pago (soma dos cache das gig_roles de gigs confirmadas)
  SELECT COALESCE(SUM(gr.cache), 0) INTO v_total_cache
  FROM confirmations c
  INNER JOIN invites i ON i.id = c.invite_id
  INNER JOIN gig_roles gr ON gr.id = i.gig_role_id
  WHERE c.confirmed = true;

  -- Retorna como JSON
  RETURN json_build_object(
    'totalUsers', v_total_users,
    'totalGigs', v_total_gigs,
    'totalCache', v_total_cache
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a função pode ser executada publicamente
GRANT EXECUTE ON FUNCTION rpc_get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_public_stats() TO authenticated;

-- ============================================
-- Função para obter músicos recentes (pública)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_get_recent_musicians(p_limit INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'user_id', p.user_id,
      'display_name', p.display_name,
      'photo_url', p.photo_url,
      'city', p.city,
      'state', p.state,
      'musician_profiles', COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'instruments', mp.instruments,
              'genres', mp.genres,
              'avg_rating', mp.avg_rating
            )
          )
          FROM musician_profiles mp
          WHERE mp.user_id = p.user_id
        ),
        '[]'::json
      )
    )
  ) INTO v_result
  FROM profiles p
  WHERE p.user_type = 'musician'
  ORDER BY p.created_at DESC
  LIMIT p_limit;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION rpc_get_recent_musicians(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_recent_musicians(INTEGER) TO authenticated;

-- ============================================
-- Função para obter trabalhos recentes confirmados (pública)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_get_recent_confirmed_gigs(p_limit INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'created_at', c.created_at,
      'invite', (
        SELECT json_build_object(
          'id', i.id,
          'gig_id', i.gig_id,
          'gig_role_id', i.gig_role_id,
          'gigs', (
            SELECT json_build_object(
              'id', g.id,
              'title', g.title,
              'start_time', g.start_time,
              'location_name', g.location_name,
              'city', g.city,
              'state', g.state,
              'flyer_url', g.flyer_url
            )
            FROM gigs g
            WHERE g.id = i.gig_id
          ),
          'gig_roles', (
            SELECT json_build_object(
              'instrument', gr.instrument,
              'cache', gr.cache
            )
            FROM gig_roles gr
            WHERE gr.id = i.gig_role_id
          )
        )
        FROM invites i
        WHERE i.id = c.invite_id
      )
    )
  ) INTO v_result
  FROM confirmations c
  WHERE c.confirmed = true
  ORDER BY c.created_at DESC
  LIMIT p_limit;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION rpc_get_recent_confirmed_gigs(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_recent_confirmed_gigs(INTEGER) TO authenticated;

