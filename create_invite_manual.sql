-- Script para criar um convite - VERSÃO MANUAL
-- Use este script se auth.uid() não funcionar no SQL Editor
-- Você precisa substituir o ID do músico manualmente

-- ============================================
-- PASSO 1: Encontrar seu ID de usuário
-- ============================================
-- Execute esta query primeiro para encontrar seu ID:
SELECT 
  id,
  email
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- PASSO 2: Copie seu ID e cole no script abaixo
-- ============================================
-- Substitua 'SEU_USER_ID_AQUI' pelo seu ID da query acima

DO $$
DECLARE
  v_musician_id UUID := 'SEU_USER_ID_AQUI';  -- ⚠️ SUBSTITUA AQUI pelo seu ID
  v_gig_id UUID;
  v_gig_role_id UUID;
  v_contractor_id UUID;
  v_invite_id UUID;
BEGIN
  -- Verificar se o ID foi substituído
  IF v_musician_id = 'SEU_USER_ID_AQUI' THEN
    RAISE EXCEPTION 'Por favor, substitua SEU_USER_ID_AQUI pelo seu ID real de usuário na linha 15.';
  END IF;

  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_musician_id) THEN
    RAISE EXCEPTION 'Usuário com ID % não encontrado. Verifique o ID.', v_musician_id;
  END IF;

  RAISE NOTICE 'Criando convite para o músico: %', v_musician_id;

  -- Encontrar uma gig existente (de qualquer contractor)
  SELECT id, contractor_id 
  INTO v_gig_id, v_contractor_id
  FROM gigs 
  WHERE status IN ('published', 'open', 'active')
    AND start_time > NOW()
  ORDER BY start_time ASC
  LIMIT 1;

  -- Se não encontrar, criar uma gig de teste
  IF v_gig_id IS NULL THEN
    -- Pegar qualquer usuário como contractor (ou usar o mesmo músico)
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
    AND musician_id = v_musician_id
    AND status = 'pending'
  LIMIT 1;

  IF v_invite_id IS NOT NULL THEN
    RAISE NOTICE 'Já existe um convite pendente para este usuário nesta gig/role com ID: %', v_invite_id;
  ELSE
    -- Criar o convite
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
      v_musician_id,
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
    RAISE NOTICE 'ID do Músico: %', v_musician_id;
    RAISE NOTICE 'Status: pending';
    RAISE NOTICE '========================================';
  END IF;

END $$;

-- ============================================
-- PASSO 3: Verificar o convite criado
-- ============================================
-- Substitua 'SEU_USER_ID_AQUI' pelo mesmo ID usado acima
SELECT 
  i.id as invite_id,
  i.status,
  i.invited_at,
  g.title as gig_title,
  g.start_time,
  gr.instrument,
  u_musician.email as musician_email,
  CASE 
    WHEN i.musician_id = 'SEU_USER_ID_AQUI' THEN '✅ Este é seu convite!'
    ELSE '❌ Este não é seu convite'
  END as status_check
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u_musician ON u_musician.id = i.musician_id
WHERE i.musician_id = 'SEU_USER_ID_AQUI'  -- ⚠️ SUBSTITUA AQUI também
  AND i.status = 'pending'
ORDER BY i.invited_at DESC;

