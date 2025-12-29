-- ============================================
-- SOLUÇÃO FINAL - Execute este script completo
-- ============================================
-- Este script cria o perfil E o convite em sequência

-- PASSO 1: Verificar se o usuário existe em auth.users
SELECT 
  id,
  email,
  'Usuário encontrado em auth.users' as status
FROM auth.users
WHERE id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94';

-- PASSO 1b: Se a foreign key apontar para uma tabela 'users' customizada,
-- primeiro criar o registro lá (se necessário)
-- Mas geralmente profiles.user_id aponta para auth.users, então vamos tentar criar o perfil
-- Se der erro, pode ser que precise criar na tabela users primeiro

-- Criar o perfil (execute esta parte)
INSERT INTO profiles (user_id, user_type, display_name)
VALUES (
  '328557ea-2ce8-4c43-ad97-f1c29cc28e94',  -- Seu ID
  'musician',
  'Usuário de Teste'
)
ON CONFLICT (user_id) DO NOTHING;

-- Verificar se o perfil foi criado
SELECT 
  'Perfil criado!' as status,
  user_id,
  user_type,
  display_name
FROM profiles
WHERE user_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94';

-- PASSO 2: Agora criar o convite
DO $$
DECLARE
  v_musician_id UUID := '328557ea-2ce8-4c43-ad97-f1c29cc28e94';
  v_gig_id UUID;
  v_gig_role_id UUID;
  v_contractor_id UUID;
  v_invite_id UUID;
BEGIN
  -- Pegar uma gig existente
  SELECT id, contractor_id 
  INTO v_gig_id, v_contractor_id
  FROM gigs 
  WHERE status IN ('published', 'open', 'active')
  LIMIT 1;

  -- Se não tiver gig, criar uma
  IF v_gig_id IS NULL THEN
    -- Pegar qualquer usuário como contractor
    SELECT id INTO v_contractor_id FROM auth.users LIMIT 1;
    
    -- Garantir que o contractor tem perfil
    INSERT INTO profiles (user_id, user_type, display_name)
    VALUES (v_contractor_id, 'contractor', 'Contractor de Teste')
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO gigs (
      contractor_id, title, location_name, city, state, timezone,
      start_time, end_time, show_minutes, break_minutes, status, created_by_musician
    ) VALUES (
      v_contractor_id, 'Gig Teste', 'Local Teste', 'São Paulo', 'SP', 'America/Sao_Paulo',
      NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
      120, 15, 'published', false
    ) RETURNING id INTO v_gig_id;
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
  
  RAISE NOTICE '✅ Convite criado com sucesso! ID: %', v_invite_id;
END $$;

-- PASSO 3: Verificar o convite criado
SELECT 
  i.id as invite_id,
  i.status,
  i.invited_at,
  g.title as gig_title,
  gr.instrument,
  u.email as musician_email,
  '✅ Convite criado e visível!' as status_check
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u ON u.id = i.musician_id
WHERE i.musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94'
  AND i.status = 'pending'
ORDER BY i.invited_at DESC;

