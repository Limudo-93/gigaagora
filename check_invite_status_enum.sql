-- Script para verificar os valores válidos do enum invite_status
-- Execute este script para ver quais valores são aceitos

-- Verificar o tipo enum e seus valores
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'invite_status'
ORDER BY e.enumsortorder;

-- Alternativa: verificar diretamente na tabela
SELECT DISTINCT status 
FROM invites 
ORDER BY status;

