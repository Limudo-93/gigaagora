-- Script para debugar por que o convite não aparece no dashboard
-- Execute este script para verificar possíveis problemas

-- ============================================
-- 1. Verificar o convite criado
-- ============================================
SELECT 
  i.id as invite_id,
  i.status,
  i.musician_id,
  i.contractor_id,
  i.invited_at,
  g.title as gig_title,
  u_musician.email as musician_email,
  u_contractor.email as contractor_email
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN auth.users u_musician ON u_musician.id = i.musician_id
JOIN auth.users u_contractor ON u_contractor.id = i.contractor_id
WHERE i.status = 'pending'
ORDER BY i.invited_at DESC;

-- ============================================
-- 2. Verificar qual é o ID do usuário logado
-- ============================================
-- Execute esta query no SQL Editor (ela usa auth.uid())
SELECT 
  id as current_user_id,
  email as current_user_email
FROM auth.users
WHERE id = auth.uid();

-- ============================================
-- 3. Verificar se o musician_id do convite corresponde ao usuário logado
-- ============================================
-- Substitua 'SEU_MUSICIAN_ID_AQUI' pelo ID do músico do convite (da query 1)
SELECT 
  i.id as invite_id,
  i.musician_id as invite_musician_id,
  auth.uid() as current_user_id,
  CASE 
    WHEN i.musician_id = auth.uid() THEN '✅ IDs correspondem - deve aparecer'
    ELSE '❌ IDs NÃO correspondem - não vai aparecer'
  END as status_check
FROM invites i
WHERE i.status = 'pending'
ORDER BY i.invited_at DESC;

-- ============================================
-- 4. Verificar políticas RLS na tabela invites
-- ============================================
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
WHERE tablename = 'invites';

-- ============================================
-- 5. Testar se a query do dashboard funcionaria
-- ============================================
-- Esta é a query que o dashboard usa (substitua auth.uid() pelo seu userId)
SELECT 
  i.id,
  i.status,
  i.created_at,
  i.gig_id,
  i.gig_role_id,
  g.id as gig_id_check,
  g.title,
  g.start_time,
  g.end_time,
  g.location_name,
  g.address_text,
  g.city,
  g.state,
  gr.instrument
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
WHERE i.musician_id = auth.uid()  -- Substitua por um ID específico se necessário
  AND i.status = 'pending'
ORDER BY i.created_at DESC;

-- ============================================
-- 6. Verificar se há problemas com os JOINs
-- ============================================
-- Verificar se a gig existe e está acessível
SELECT 
  g.id,
  g.title,
  g.contractor_id,
  g.status as gig_status
FROM gigs g
WHERE g.id IN (
  SELECT gig_id FROM invites WHERE status = 'pending'
);

-- Verificar se a role existe
SELECT 
  gr.id,
  gr.gig_id,
  gr.instrument
FROM gig_roles gr
WHERE gr.id IN (
  SELECT gig_role_id FROM invites WHERE status = 'pending'
);

