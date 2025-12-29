-- ============================================
-- SCRIPT PARA LIMPAR O BANCO DE DADOS
-- Remove todos os dados mas mantém a estrutura das tabelas
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ATENÇÃO: Este script irá DELETAR TODOS OS DADOS do banco!
-- Use apenas em ambiente de desenvolvimento/testes

BEGIN;

-- ============================================
-- 1. DELETAR DADOS DE TABELAS DEPENDENTES (ordem inversa das foreign keys)
-- ============================================

-- Mensagens e conversas
DELETE FROM messages;
DELETE FROM conversations;

-- Confirmações
DELETE FROM confirmations;

-- Avaliações
DELETE FROM ratings;

-- Convites
DELETE FROM invites;

-- Roles de gigs
DELETE FROM gig_roles;

-- Gigs
DELETE FROM gigs;

-- Relacionamentos e histórico
DELETE FROM favorites;
DELETE FROM band_musician_history;
DELETE FROM reliability_events;
DELETE FROM blocks;
DELETE FROM active_blocks;
DELETE FROM responsibility_terms;

-- Diretório de músicos (se existir)
DELETE FROM musician_directory;

-- Perfis específicos
DELETE FROM musician_profiles;
DELETE FROM contractor_profiles;

-- Perfis gerais (mas NÃO deleta auth.users)
DELETE FROM profiles;

-- Preferências de usuário (se existir)
DELETE FROM user_preferences;

-- ============================================
-- 2. RESETAR SEQUÊNCIAS (se houver alguma)
-- ============================================

-- Nota: UUIDs não usam sequências, mas se houver alguma tabela com SERIAL/BIGSERIAL:
-- ALTER SEQUENCE nome_da_sequencia RESTART WITH 1;

-- ============================================
-- 3. LIMPAR STORAGE (arquivos no Supabase Storage)
-- ============================================

-- Nota: Para limpar arquivos do Storage, você precisa fazer isso manualmente
-- através da interface do Supabase ou usar a API de Storage
-- Exemplo de buckets que podem ter arquivos:
-- - profile-photos
-- - gig-flyers

-- ============================================
-- 4. VERIFICAÇÃO FINAL
-- ============================================

-- Contar registros restantes (deve retornar 0 para todas)
DO $$
DECLARE
    table_count INTEGER;
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'messages', 'conversations', 'confirmations', 'ratings', 
            'invites', 'gig_roles', 'gigs', 'favorites', 
            'band_musician_history', 'reliability_events', 'blocks', 
            'active_blocks', 'responsibility_terms', 'musician_directory',
            'musician_profiles', 'contractor_profiles', 'profiles', 'user_preferences'
        ])
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_count;
        RAISE NOTICE 'Tabela %: % registros', table_name, table_count;
    END LOOP;
END $$;

COMMIT;

-- ============================================
-- MENSAGEM FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Banco de dados limpo com sucesso!';
    RAISE NOTICE 'Todas as tabelas foram esvaziadas.';
    RAISE NOTICE 'A estrutura das tabelas foi mantida.';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Crie novos usuários através do sistema de autenticação';
    RAISE NOTICE '2. Complete os perfis dos usuários';
    RAISE NOTICE '3. Crie novas gigs para testar';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Os usuários em auth.users NÃO foram deletados.';
    RAISE NOTICE 'Se quiser deletar os usuários também, faça isso manualmente';
    RAISE NOTICE 'através da interface do Supabase Auth ou use:';
    RAISE NOTICE 'DELETE FROM auth.users; (CUIDADO: isso deleta TODOS os usuários!)';
END $$;

