-- ============================================
-- Script de Verificação e Correção do Banco de Dados
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. VERIFICAR SE RPC FUNCTIONS EXISTEM
-- ============================================

-- Verificar get_or_create_conversation
SELECT 
    routine_name, 
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_or_create_conversation'
AND routine_schema = 'public';

-- Verificar rpc_create_cancellation_notification
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'rpc_create_cancellation_notification'
AND routine_schema = 'public';

-- Verificar rpc_accept_invite
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'rpc_accept_invite'
AND routine_schema = 'public';

-- Verificar rpc_list_pending_invites
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'rpc_list_pending_invites'
AND routine_schema = 'public';

-- Verificar rpc_list_upcoming_confirmed_gigs
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'rpc_list_upcoming_confirmed_gigs'
AND routine_schema = 'public';

-- 2. VERIFICAR RLS POLICIES
-- ============================================

-- Verificar políticas da tabela cancellation_notifications
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
WHERE tablename = 'cancellation_notifications'
ORDER BY cmd, policyname;

-- Verificar políticas da tabela messages
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
WHERE tablename = 'messages'
ORDER BY cmd, policyname;

-- Verificar políticas da tabela conversations
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
WHERE tablename = 'conversations'
ORDER BY cmd, policyname;

-- Verificar políticas da tabela ratings
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
WHERE tablename = 'ratings'
ORDER BY cmd, policyname;

-- 3. VERIFICAR ÍNDICES ÚNICOS
-- ============================================

-- Verificar índices únicos da tabela ratings
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ratings'
AND indexname LIKE '%ratings_one_per_invite%';

-- 4. VERIFICAR ESTRUTURA DE TABELAS
-- ============================================

-- Verificar se tabela cancellation_notifications existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cancellation_notifications'
ORDER BY ordinal_position;

-- Verificar se tabela conversations existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Verificar se tabela messages existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Verificar colunas da tabela ratings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ratings'
AND column_name IN ('rater_type', 'rated_type', 'predefined_comments', 'custom_comment', 'is_public')
ORDER BY ordinal_position;

