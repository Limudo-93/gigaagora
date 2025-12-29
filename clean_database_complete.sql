-- ============================================
-- SCRIPT COMPLETO PARA LIMPAR O BANCO DE DADOS
-- Remove TODOS os dados incluindo usuários
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ⚠️ ATENÇÃO: Este script irá DELETAR TODOS OS DADOS E USUÁRIOS!
-- ⚠️ Use apenas em ambiente de desenvolvimento/testes
-- ⚠️ Esta ação NÃO PODE ser desfeita!

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Iniciando limpeza do banco de dados...';
    RAISE NOTICE '========================================';
END $$;

BEGIN;

-- ============================================
-- 1. DELETAR DADOS DE TABELAS DEPENDENTES
-- ============================================

DO $$ BEGIN RAISE NOTICE 'Limpando mensagens...'; END $$;
DELETE FROM messages;
DELETE FROM conversations;

DO $$ BEGIN RAISE NOTICE 'Limpando confirmações...'; END $$;
DELETE FROM confirmations;

DO $$ BEGIN RAISE NOTICE 'Limpando avaliações...'; END $$;
DELETE FROM ratings;

DO $$ BEGIN RAISE NOTICE 'Limpando convites...'; END $$;
DELETE FROM invites;

DO $$ BEGIN RAISE NOTICE 'Limpando roles de gigs...'; END $$;
DELETE FROM gig_roles;

DO $$ BEGIN RAISE NOTICE 'Limpando gigs...'; END $$;
DELETE FROM gigs;

DO $$ BEGIN RAISE NOTICE 'Limpando relacionamentos...'; END $$;
DELETE FROM favorites;
DELETE FROM band_musician_history;
DELETE FROM reliability_events;
DELETE FROM blocks;
DELETE FROM active_blocks;
DELETE FROM responsibility_terms;

DO $$ BEGIN RAISE NOTICE 'Limpando diretório de músicos...'; END $$;
DELETE FROM musician_directory;

DO $$ BEGIN RAISE NOTICE 'Limpando perfis específicos...'; END $$;
DELETE FROM musician_profiles;
DELETE FROM contractor_profiles;

DO $$ BEGIN RAISE NOTICE 'Limpando perfis gerais...'; END $$;
DELETE FROM profiles;

DO $$ BEGIN RAISE NOTICE 'Limpando preferências...'; END $$;
DELETE FROM user_preferences;

-- ============================================
-- 2. DELETAR USUÁRIOS (OPCIONAL - DESCOMENTE SE QUISER)
-- ============================================

-- ⚠️ CUIDADO: Descomentar a linha abaixo irá deletar TODOS os usuários!
-- DELETE FROM auth.users;

-- Se quiser deletar apenas usuários que não são admin, use:
-- DELETE FROM auth.users WHERE email NOT LIKE '%@admin%';

-- ============================================
-- 3. VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
    table_count INTEGER;
    table_name TEXT;
    total_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICAÇÃO DE LIMPEZA:';
    RAISE NOTICE '========================================';
    
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'messages', 'conversations', 'confirmations', 'ratings', 
            'invites', 'gig_roles', 'gigs', 'favorites', 
            'band_musician_history', 'reliability_events', 'blocks', 
            'active_blocks', 'responsibility_terms', 'musician_directory',
            'musician_profiles', 'contractor_profiles', 'profiles', 'user_preferences'
        ])
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_count;
            total_count := total_count + table_count;
            IF table_count > 0 THEN
                RAISE NOTICE '⚠️  %: % registros restantes', table_name, table_count;
            ELSE
                RAISE NOTICE '✓  %: limpa', table_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️  %: tabela não existe ou erro ao verificar', table_name;
        END;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de registros restantes: %', total_count;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================
-- MENSAGEM FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Banco de dados limpo com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Crie novos usuários através do sistema de autenticação';
    RAISE NOTICE '2. Complete os perfis dos usuários (músico ou contratante)';
    RAISE NOTICE '3. Crie novas gigs para testar';
    RAISE NOTICE '4. Teste o fluxo completo de convites e confirmações';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Se você descomentou a linha DELETE FROM auth.users,';
    RAISE NOTICE 'todos os usuários foram deletados também.';
END $$;

