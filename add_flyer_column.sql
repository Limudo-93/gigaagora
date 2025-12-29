-- Script para adicionar coluna de flyer na tabela gigs
-- Execute este script no SQL Editor do Supabase

-- Adiciona a coluna flyer_url na tabela gigs
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS flyer_url TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN gigs.flyer_url IS 'URL do flyer/poster do evento armazenado no Supabase Storage';

