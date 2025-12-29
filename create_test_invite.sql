-- Script para criar um convite pendente de teste
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- PASSO 1: Verificar/Criar dados necessários
-- ============================================

-- 1.1. Verificar se existe uma gig (use uma gig existente ou crie uma de teste)
-- Se você já tem uma gig, anote o ID dela e pule para o passo 1.2
-- Caso contrário, vamos criar uma gig de teste:

DO $$
DECLARE
  v_contractor_id UUID;
  v_gig_id UUID;
  v_gig_role_id UUID;
  v_musician_id UUID;
  v_invite_id UUID;
BEGIN
  -- 1.2. Pegar o primeiro usuário autenticado como contractor (você pode substituir por um ID específico)
  SELECT id INTO v_contractor_id 
  FROM auth.users 
  LIMIT 1;
  
  IF v_contractor_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado. Crie um usuário primeiro.';
  END IF;

  -- 1.3. Verificar se existe uma gig para este contractor
  SELECT id INTO v_gig_id 
  FROM gigs 
  WHERE contractor_id = v_contractor_id 
  LIMIT 1;

  -- Se não existir, criar uma gig de teste
  IF v_gig_id IS NULL THEN
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
      'Gig de Teste para Convite',
      'Esta é uma gig de teste criada para testar o sistema de convites.',
      'Bar de Teste',
      'Rua de Teste, 123',
      'São Paulo',
      'SP',
      'America/Sao_Paulo',
      (NOW() + INTERVAL '7 days'), -- 7 dias a partir de agora
      (NOW() + INTERVAL '7 days' + INTERVAL '2 hours'), -- 2 horas depois
      120, -- 120 minutos de show
      15,  -- 15 minutos de intervalo
      'published',
      false
    ) RETURNING id INTO v_gig_id;
    
    RAISE NOTICE 'Gig de teste criada com ID: %', v_gig_id;
  ELSE
    RAISE NOTICE 'Usando gig existente com ID: %', v_gig_id;
  END IF;

  -- 1.4. Verificar se existe uma role para esta gig
  SELECT id INTO v_gig_role_id 
  FROM gig_roles 
  WHERE gig_id = v_gig_id 
  LIMIT 1;

  -- Se não existir, criar uma role de teste
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
    
    RAISE NOTICE 'Role de teste criada com ID: %', v_gig_role_id;
  ELSE
    RAISE NOTICE 'Usando role existente com ID: %', v_gig_role_id;
  END IF;

  -- 1.5. Pegar um usuário diferente como músico (ou usar um ID específico)
  -- Se você quiser usar um músico específico, substitua esta query
  SELECT id INTO v_musician_id 
  FROM auth.users 
  WHERE id != v_contractor_id 
  LIMIT 1;

  -- Se não houver outro usuário, vamos usar o mesmo (para teste)
  IF v_musician_id IS NULL THEN
    v_musician_id := v_contractor_id;
    RAISE NOTICE 'Usando o mesmo usuário como músico (para teste)';
  END IF;

  -- ============================================
  -- PASSO 2: Criar o convite pendente
  -- ============================================

  -- Verificar se já existe um convite pendente para evitar duplicatas
  SELECT id INTO v_invite_id
  FROM invites
  WHERE gig_id = v_gig_id
    AND gig_role_id = v_gig_role_id
    AND musician_id = v_musician_id
    AND status = 'pending'
  LIMIT 1;

  IF v_invite_id IS NOT NULL THEN
    RAISE NOTICE 'Já existe um convite pendente com ID: %', v_invite_id;
    RAISE NOTICE 'Para criar um novo, primeiro cancele ou delete o convite existente.';
  ELSE
    -- Criar o convite pendente
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
      'pending', -- status: pending, accepted, declined, cancelled
      NOW(),
      false,
      NULL
    ) RETURNING id INTO v_invite_id;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Convite pendente criado com sucesso!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ID do Convite: %', v_invite_id;
    RAISE NOTICE 'ID da Gig: %', v_gig_id;
    RAISE NOTICE 'ID da Role: %', v_gig_role_id;
    RAISE NOTICE 'ID do Contractor: %', v_contractor_id;
    RAISE NOTICE 'ID do Músico: %', v_musician_id;
    RAISE NOTICE 'Status: pending';
    RAISE NOTICE '========================================';
  END IF;

END $$;

-- ============================================
-- PASSO 3: Verificar o convite criado
-- ============================================

-- Consulta para ver os convites pendentes
SELECT 
  i.id as invite_id,
  i.status,
  i.invited_at,
  g.title as gig_title,
  g.start_time,
  gr.instrument,
  gr.quantity,
  u_contractor.email as contractor_email,
  u_musician.email as musician_email
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u_contractor ON u_contractor.id = i.contractor_id
JOIN auth.users u_musician ON u_musician.id = i.musician_id
WHERE i.status = 'pending'
ORDER BY i.invited_at DESC
LIMIT 10;

