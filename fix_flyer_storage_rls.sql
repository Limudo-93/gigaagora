-- Script para corrigir políticas RLS do bucket de flyers
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Verificar se o bucket existe e criar se necessário
-- ============================================
-- Nota: Buckets são criados via Storage API, mas podemos verificar se existe

-- ============================================
-- 2. Remover políticas antigas (se existirem)
-- ============================================
-- As políticas de storage são gerenciadas via Storage API, mas podemos criar via SQL

-- ============================================
-- 3. Criar políticas RLS para o bucket gig-flyers
-- ============================================

-- Política para INSERT: usuários autenticados podem fazer upload de flyers
-- Nota: No Supabase, as políticas de storage são criadas via Dashboard ou API
-- Mas podemos usar a função storage.objects para criar políticas

-- Primeiro, vamos garantir que o bucket existe e está público para leitura
-- Isso deve ser feito no Dashboard do Supabase em Storage > gig-flyers > Settings
-- Mas podemos criar a política via SQL:

-- Política para permitir upload (INSERT) de flyers por usuários autenticados
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command)
SELECT 
  'Users can upload flyers',
  id,
  '(bucket_id = ''gig-flyers''::text)',
  '(bucket_id = ''gig-flyers''::text) AND (auth.role() = ''authenticated''::text)',
  'INSERT'
FROM storage.buckets
WHERE name = 'gig-flyers'
ON CONFLICT DO NOTHING;

-- Política para permitir leitura (SELECT) de flyers por qualquer usuário autenticado
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command)
SELECT 
  'Users can view flyers',
  id,
  '(bucket_id = ''gig-flyers''::text)',
  '(bucket_id = ''gig-flyers''::text) AND (auth.role() = ''authenticated''::text)',
  'SELECT'
FROM storage.buckets
WHERE name = 'gig-flyers'
ON CONFLICT DO NOTHING;

-- Política para permitir atualização (UPDATE) de flyers pelo próprio usuário
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command)
SELECT 
  'Users can update their own flyers',
  id,
  '(bucket_id = ''gig-flyers''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  '(bucket_id = ''gig-flyers''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  'UPDATE'
FROM storage.buckets
WHERE name = 'gig-flyers'
ON CONFLICT DO NOTHING;

-- Política para permitir deleção (DELETE) de flyers pelo próprio usuário
INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command)
SELECT 
  'Users can delete their own flyers',
  id,
  '(bucket_id = ''gig-flyers''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  '(bucket_id = ''gig-flyers''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  'DELETE'
FROM storage.buckets
WHERE name = 'gig-flyers'
ON CONFLICT DO NOTHING;

-- ============================================
-- ALTERNATIVA: Se as políticas acima não funcionarem,
-- use o método mais simples via Dashboard:
-- ============================================
-- 1. Vá para Supabase Dashboard > Storage > gig-flyers
-- 2. Clique em "Policies" ou "RLS"
-- 3. Adicione as seguintes políticas:

-- Política 1: INSERT
-- Name: "Authenticated users can upload flyers"
-- Allowed operation: INSERT
-- Policy definition: 
--   (bucket_id = 'gig-flyers')
-- Policy check:
--   (bucket_id = 'gig-flyers' AND auth.role() = 'authenticated')

-- Política 2: SELECT
-- Name: "Authenticated users can view flyers"
-- Allowed operation: SELECT
-- Policy definition:
--   (bucket_id = 'gig-flyers')
-- Policy check:
--   (bucket_id = 'gig-flyers' AND auth.role() = 'authenticated')

-- Política 3: UPDATE
-- Name: "Users can update their own flyers"
-- Allowed operation: UPDATE
-- Policy definition:
--   (bucket_id = 'gig-flyers' AND auth.uid()::text = (storage.foldername(name))[1])
-- Policy check:
--   (bucket_id = 'gig-flyers' AND auth.uid()::text = (storage.foldername(name))[1])

-- Política 4: DELETE
-- Name: "Users can delete their own flyers"
-- Allowed operation: DELETE
-- Policy definition:
--   (bucket_id = 'gig-flyers' AND auth.uid()::text = (storage.foldername(name))[1])
-- Policy check:
--   (bucket_id = 'gig-flyers' AND auth.uid()::text = (storage.foldername(name))[1])

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- As políticas de storage no Supabase podem precisar ser criadas via Dashboard
-- ou via API. Se o SQL acima não funcionar, use o método do Dashboard descrito acima.

