# 🔧 Correções: Problemas com Aceitar Convites

## 📋 Problemas Identificados

### Problema 1: Músico aceita mas não aparece como confirmado
**Causa:** Quando o músico aceita via `rpc_accept_invite`, apenas o status do invite muda para 'accepted', mas não é criado um registro na tabela `confirmations`. A seção "Músicos Confirmados" só mostra músicos que têm registro em `confirmations` com `confirmed = true`.

**Solução:** Modificar `rpc_accept_invite` para criar automaticamente uma confirmação quando o músico aceita.

### Problema 2: Dois músicos podem aceitar o mesmo convite (para a mesma role)
**Causa:** Múltiplos invites podem ser criados para a mesma `gig_role_id` com diferentes músicos, e todos podem ser aceitos simultaneamente. Não há constraint que impeça isso.

**Solução:** 
- Quando um músico aceita, cancelar automaticamente outros invites aceitos para a mesma role
- Adicionar constraints no banco de dados para prevenir múltiplas confirmações por role

## ✅ Correções Aplicadas

### 1. Script SQL: `fix_accept_invite_issues.sql`

Este script:
- ✅ Atualiza `rpc_accept_invite` para criar confirmação automaticamente
- ✅ Cancela outros invites aceitos para a mesma role quando um músico aceita
- ✅ Adiciona trigger para prevenir múltiplas confirmações por role
- ✅ Adiciona índices únicos para garantir integridade

### 2. Como Aplicar

1. Execute o script SQL no Supabase:
   ```sql
   -- Copie e cole o conteúdo de fix_accept_invite_issues.sql
   -- no SQL Editor do Supabase Dashboard
   ```

2. Teste o fluxo:
   - Músico aceita um convite
   - Verifique se aparece na lista de "Músicos Confirmados"
   - Tente aceitar outro convite para a mesma role (deve ser bloqueado)

## 🔍 Verificações

Após aplicar o script, verifique:

1. **Músico aparece como confirmado:**
   - Músico aceita convite
   - Vá na página da gig > "Músicos Confirmados"
   - O músico deve aparecer imediatamente

2. **Prevenção de múltiplos aceites:**
   - Crie dois convites para a mesma role (instrumento)
   - Músico 1 aceita
   - Músico 2 tenta aceitar → deve receber erro "Esta vaga já foi preenchida"

## 📝 Notas

- A confirmação é criada automaticamente quando o músico aceita
- O contratante ainda pode "desconfirmar" ou "confirmar manualmente" se necessário
- Apenas um músico pode ser confirmado por role (instrumento) por vez

