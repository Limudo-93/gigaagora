-- Script para criar um convite para o usuário atualmente logado
-- Execute este script no SQL Editor do Supabase (você precisa estar logado)

-- ============================================
-- PASSO 1: Verificar o usuário logado
-- ============================================
SELECT 
  id as current_user_id,
  email as current_user_email
FROM auth.users
WHERE id = auth.uid();

-- ============================================
-- PASSO 2: Encontrar uma gig e role existentes
-- ============================================
-- Vamos usar uma gig existente ou criar uma nova
DO $$
DECLARE
  v_current_user_id UUID;
  v_gig_id UUID;
  v_gig_role_id UUID;
  v_invite_id UUID;
BEGIN
  -- Pegar o usuário logado
  SELECT auth.uid() INTO v_current_user_id;
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Você precisa estar logado para executar este script.';
  END IF;

  RAISE NOTICE 'Usuário logado: %', v_current_user_id;

  -- Encontrar uma gig existente (de qualquer contractor)
  SELECT id INTO v_gig_id 
  FROM gigs 
  WHERE status IN ('published', 'open', 'active')
    AND start_time > NOW()
  ORDER BY start_time ASC
  LIMIT 1;

  -- Se não encontrar, criar uma gig de teste
  IF v_gig_id IS NULL THEN
    -- Primeiro, encontrar um contractor (pode ser você mesmo ou outro usuário)
    DECLARE
      v_contractor_id UUID;
    BEGIN
      SELECT id INTO v_contractor_id 
      FROM auth.users 
      LIMIT 1;
      
      INSERT INTO gigs (
        contractor_id,
        title,
        description,
        location_name,
        address_text,
        city,
        state,
        timezone,
        start_time,
        end_time,
        show_minutes,
        break_minutes,
        status,
        created_by_musician
      ) VALUES (
        v_contractor_id,
        'Gig de Teste - Convite',
        'Gig criada para testar o sistema de convites.',
        'Local de Teste',
        'Endereço de Teste, 123',
        'São Paulo',
        'SP',
        'America/Sao_Paulo',
        (NOW() + INTERVAL '7 days'),
        (NOW() + INTERVAL '7 days' + INTERVAL '2 hours'),
        120,
        15,
        'published',
        false
      ) RETURNING id INTO v_gig_id;
      
      RAISE NOTICE 'Gig de teste criada com ID: %', v_gig_id;
    END;
  ELSE
    RAISE NOTICE 'Usando gig existente com ID: %', v_gig_id;
  END IF;

  -- Encontrar ou criar uma role para esta gig
  SELECT id INTO v_gig_role_id 
  FROM gig_roles 
  WHERE gig_id = v_gig_id 
  LIMIT 1;

  IF v_gig_role_id IS NULL THEN
    INSERT INTO gig_roles (
      gig_id,
      instrument,
      quantity,
      desired_genres,
      desired_skills,
      desired_setup,
      notes
    ) VALUES (
      v_gig_id,
      'Violão',
      1,
      ARRAY['MPB', 'Sertanejo'],
      ARRAY['Leitura de partitura'],
      ARRAY['Amplificador'],
      'Músico com experiência em shows ao vivo'
    ) RETURNING id INTO v_gig_role_id;
    
    RAISE NOTICE 'Role criada com ID: %', v_gig_role_id;
  ELSE
    RAISE NOTICE 'Usando role existente com ID: %', v_gig_role_id;
  END IF;

  -- Verificar se já existe um convite para este usuário nesta gig/role
  SELECT id INTO v_invite_id
  FROM invites
  WHERE gig_id = v_gig_id
    AND gig_role_id = v_gig_role_id
    AND musician_id = v_current_user_id
    AND status = 'pending'
  LIMIT 1;

  IF v_invite_id IS NOT NULL THEN
    RAISE NOTICE 'Já existe um convite pendente para você nesta gig/role com ID: %', v_invite_id;
    RAISE NOTICE 'Para criar um novo, primeiro cancele ou delete o convite existente.';
  ELSE
    -- Pegar o contractor_id da gig
    DECLARE
      v_contractor_id UUID;
    BEGIN
      SELECT contractor_id INTO v_contractor_id
      FROM gigs
      WHERE id = v_gig_id;
      
      -- Criar o convite para o usuário logado
      INSERT INTO invites (
        gig_id,
        gig_role_id,
        contractor_id,
        musician_id,
        status,
        invited_at,
        warned_short_gap,
        warned_short_gap_minutes
      ) VALUES (
        v_gig_id,
        v_gig_role_id,
        v_contractor_id,
        v_current_user_id,  -- Você (o usuário logado)
        'pending',
        NOW(),
        false,
        NULL
      ) RETURNING id INTO v_invite_id;
      
      RAISE NOTICE '========================================';
      RAISE NOTICE '✅ Convite criado com sucesso!';
      RAISE NOTICE '========================================';
      RAISE NOTICE 'ID do Convite: %', v_invite_id;
      RAISE NOTICE 'ID da Gig: %', v_gig_id;
      RAISE NOTICE 'ID da Role: %', v_gig_role_id;
      RAISE NOTICE 'ID do Músico (você): %', v_current_user_id;
      RAISE NOTICE 'Status: pending';
      RAISE NOTICE '========================================';
      RAISE NOTICE 'Agora recarregue o dashboard e o convite deve aparecer!';
    END;
  END IF;

END $$;

-- ============================================
-- PASSO 3: Verificar o convite criado
-- ============================================
SELECT 
  i.id as invite_id,
  i.status,
  i.invited_at,
  g.title as gig_title,
  g.start_time,
  gr.instrument,
  u_musician.email as musician_email,
  CASE 
    WHEN i.musician_id = auth.uid() THEN '✅ Este é seu convite!'
    ELSE '❌ Este não é seu convite'
  END as status_check
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u_musician ON u_musician.id = i.musician_id
WHERE i.musician_id = auth.uid()
  AND i.status = 'pending'
ORDER BY i.invited_at DESC;

