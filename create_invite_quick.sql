-- Script RÁPIDO para criar um convite
-- Baseado no ID do usuário que vimos no console: 328557ea-2ce8-4c43-ad97-f1c29cc28e94

-- ============================================
-- OPÇÃO 1: Atualizar o convite existente para o seu usuário
-- ============================================
UPDATE invites
SET musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94'  -- Seu ID do console
WHERE id = '1f82dd3a-e1da-425b-9507-5be7bda24edc'  -- ID do convite existente
  AND status = 'pending';

-- Verificar se funcionou
SELECT 
  i.id,
  i.musician_id,
  u.email as musician_email,
  g.title as gig_title,
  CASE 
    WHEN i.musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94' THEN '✅ Agora é seu convite!'
    ELSE '❌ Ainda não é seu convite'
  END as status
FROM invites i
JOIN auth.users u ON u.id = i.musician_id
JOIN gigs g ON g.id = i.gig_id
WHERE i.id = '1f82dd3a-e1da-425b-9507-5be7bda24edc';

-- ============================================
-- OPÇÃO 2: Criar um novo convite para você
-- ============================================
DO $$
DECLARE
  v_musician_id UUID := '328557ea-2ce8-4c43-ad97-f1c29cc28e94';  -- Seu ID
  v_gig_id UUID;
  v_gig_role_id UUID;
  v_contractor_id UUID;
  v_invite_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  -- Verificar se o perfil existe na tabela profiles
  SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = v_musician_id) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- Criar o perfil se não existir
    INSERT INTO profiles (user_id, user_type, display_name)
    VALUES (v_musician_id, 'musician', 'Usuário de Teste')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Perfil criado para o usuário: %', v_musician_id;
  ELSE
    RAISE NOTICE 'Perfil já existe para o usuário: %', v_musician_id;
  END IF;

  -- Pegar uma gig existente
  SELECT id, contractor_id 
  INTO v_gig_id, v_contractor_id
  FROM gigs 
  WHERE status IN ('published', 'open', 'active')
  LIMIT 1;

  -- Se não tiver gig, criar uma
  IF v_gig_id IS NULL THEN
    DECLARE
      v_temp_contractor_id UUID;
    BEGIN
      SELECT id INTO v_temp_contractor_id FROM auth.users LIMIT 1;
      
      -- Garantir que o contractor também tem perfil
      IF NOT EXISTS(SELECT 1 FROM profiles WHERE user_id = v_temp_contractor_id) THEN
        INSERT INTO profiles (user_id, user_type, display_name)
        VALUES (v_temp_contractor_id, 'contractor', 'Contractor de Teste')
        ON CONFLICT (user_id) DO NOTHING;
      END IF;
      
      v_contractor_id := v_temp_contractor_id;
    
    INSERT INTO gigs (
      contractor_id, title, location_name, city, state, timezone,
      start_time, end_time, show_minutes, break_minutes, status, created_by_musician
    ) VALUES (
      v_contractor_id, 'Gig Teste', 'Local Teste', 'São Paulo', 'SP', 'America/Sao_Paulo',
      NOW() + INTERVAL '7 days',       NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
      120, 15, 'published', false
    ) RETURNING id INTO v_gig_id;
    END;
  END IF;

  -- Pegar ou criar role
  SELECT id INTO v_gig_role_id FROM gig_roles WHERE gig_id = v_gig_id LIMIT 1;
  
  IF v_gig_role_id IS NULL THEN
    INSERT INTO gig_roles (gig_id, instrument, quantity)
    VALUES (v_gig_id, 'Violão', 1)
    RETURNING id INTO v_gig_role_id;
  END IF;

  -- Criar convite
  INSERT INTO invites (
    gig_id, gig_role_id, contractor_id, musician_id, status, invited_at
  ) VALUES (
    v_gig_id, v_gig_role_id, v_contractor_id, v_musician_id, 'pending', NOW()
  ) RETURNING id INTO v_invite_id;
  
  RAISE NOTICE '✅ Convite criado! ID: %', v_invite_id;
END $$;

-- Verificar
SELECT 
  i.id, i.status, g.title, gr.instrument, u.email
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u ON u.id = i.musician_id
WHERE i.musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94'
  AND i.status = 'pending';

