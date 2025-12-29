# Correções Aplicadas e Pendentes

## ✅ Correções Aplicadas no Código

### 1. **UpcomingConfirmedGigs.tsx - checkExistingRatings**
**Problema**: Função não estava envolvida em `useCallback` e não filtrava por `rater_type`
**Correção**:
- Envolvida em `useCallback` com dependência `[userId]`
- Query agora seleciona `rater_type, musician_id, contractor_id` para debug
- Adicionada dependência `checkExistingRatings` no `useEffect`

### 2. **Instrumentação de Debug Adicionada**
**Logs adicionados em**:
- `checkExistingRatings` - para testar H1 e H8
- Importação dinâmica de messages - para testar H2
- Chamadas RPC - para testar H3 e H5
- `useEffect` - para testar H4

## ⚠️ Correções Necessárias no Banco de Dados

### 1. **Corrigir checkExistingRatings Query**
A query atual não filtra corretamente por `rater_type`. A lógica correta seria:

```sql
-- A query deve buscar apenas avaliações onde o usuário é o AVALIADOR
-- Não onde ele é o avaliado
```

**Ação**: A correção já foi aplicada no código, mas a query precisa ser testada.

### 2. **Verificar se RPC Functions Existem**
Execute estas queries para verificar:

```sql
-- Verificar se get_or_create_conversation existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_or_create_conversation';

-- Verificar se rpc_create_cancellation_notification existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'rpc_create_cancellation_notification';

-- Verificar se rpc_accept_invite existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'rpc_accept_invite';
```

### 3. **Verificar RLS Policies**
Verificar se as políticas RLS permitem que funções SECURITY DEFINER funcionem:

```sql
-- Verificar políticas da tabela cancellation_notifications
SELECT * FROM pg_policies WHERE tablename = 'cancellation_notifications';

-- Verificar políticas da tabela messages
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- Verificar políticas da tabela conversations
SELECT * FROM pg_policies WHERE tablename = 'conversations';
```

## 🔍 Problemas Identificados que Precisam de Teste

### H1: Query de avaliações incorreta
**Status**: Parcialmente corrigido - query agora seleciona mais campos, mas ainda precisa filtrar por `rater_type` corretamente

### H2: Importação dinâmica
**Status**: Instrumentado - precisa testar se falha

### H3: RPC functions podem não existir
**Status**: Instrumentado - precisa verificar no banco

### H4: Dependências em useEffect
**Status**: ✅ CORRIGIDO - `checkExistingRatings` agora está em `useCallback` e nas dependências

### H5: RLS bloqueando SECURITY DEFINER
**Status**: Instrumentado - precisa testar

### H8: Query não filtra por rater_type
**Status**: Parcialmente corrigido - precisa melhorar a lógica

## 📋 Próximos Passos

1. **Executar a aplicação** e reproduzir os cenários:
   - Aceitar um convite
   - Cancelar uma gig confirmada
   - Avaliar uma gig concluída
   - Verificar se botões de avaliação aparecem corretamente

2. **Analisar os logs** em `.cursor/debug.log` após a execução

3. **Verificar no banco** se as RPC functions existem

4. **Aplicar correções finais** baseadas nos logs

