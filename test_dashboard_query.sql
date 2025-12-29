-- Script para testar a query exata que o dashboard usa
-- Execute este script substituindo auth.uid() pelo ID do músico do convite

-- ============================================
-- PASSO 1: Encontrar o ID do músico do convite
-- ============================================
SELECT 
  i.id as invite_id,
  i.musician_id,
  i.status,
  u.email as musician_email
FROM invites i
JOIN auth.users u ON u.id = i.musician_id
WHERE i.status = 'pending'
ORDER BY i.invited_at DESC
LIMIT 1;

-- ============================================
-- PASSO 2: Testar a query do dashboard
-- ============================================
-- Substitua 'SEU_MUSICIAN_ID_AQUI' pelo musician_id da query acima
-- OU use auth.uid() se você estiver logado como esse músico

-- Opção A: Se você souber o ID do músico
/*
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
WHERE i.musician_id = 'SEU_MUSICIAN_ID_AQUI'  -- Substitua pelo ID real
  AND i.status = 'pending'
ORDER BY i.created_at DESC;
*/

-- Opção B: Usando auth.uid() (se você estiver logado como o músico)
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
WHERE i.musician_id = auth.uid()  -- Usa o usuário logado
  AND i.status = 'pending'
ORDER BY i.created_at DESC;

-- ============================================
-- PASSO 3: Verificar se as políticas RLS estão bloqueando
-- ============================================
-- Esta query deve retornar TRUE se você conseguir ver o convite
SELECT 
  EXISTS (
    SELECT 1 
    FROM invites i
    WHERE i.musician_id = auth.uid()
      AND i.status = 'pending'
  ) as can_see_pending_invites;

-- ============================================
-- PASSO 4: Verificar se consegue ver a gig através do JOIN
-- ============================================
SELECT 
  EXISTS (
    SELECT 1 
    FROM invites i
    JOIN gigs g ON g.id = i.gig_id
    WHERE i.musician_id = auth.uid()
      AND i.status = 'pending'
  ) as can_see_gig_through_join;

-- ============================================
-- PASSO 5: Verificar se consegue ver a role através do JOIN
-- ============================================
SELECT 
  EXISTS (
    SELECT 1 
    FROM invites i
    JOIN gig_roles gr ON gr.id = i.gig_role_id
    WHERE i.musician_id = auth.uid()
      AND i.status = 'pending'
  ) as can_see_role_through_join;

-- ============================================
-- PASSO 6: Testar a query completa (simulando o dashboard)
-- ============================================
-- Esta é a query EXATA que o dashboard usa
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
WHERE i.musician_id = auth.uid()
  AND i.status = 'pending'
ORDER BY i.created_at DESC;

-- Se esta query retornar resultados, o problema está no frontend
-- Se não retornar, o problema está nas políticas RLS ou no musician_id

