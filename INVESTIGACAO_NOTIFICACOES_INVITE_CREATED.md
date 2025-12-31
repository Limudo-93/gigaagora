# Investigação: Notificações Push não são enviadas quando um novo convite é criado

## 🔍 Problema Identificado

Quando um novo convite é criado, o músico **não recebe notificação push**, mesmo que:
- ✅ Notificações enviadas manualmente pela página de notificações funcionem
- ✅ O sistema de push notifications esteja configurado corretamente

## 🐛 Causa Raiz

A função `trg_invite_created_notify()` **não tem `SECURITY DEFINER`**, o que pode causar problemas com RLS (Row Level Security) ao chamar `enqueue_push_notification()`.

### Problemas específicos:

1. **RLS bloqueando chamadas**: A função `trg_invite_created_notify()` não tem `SECURITY DEFINER`, então quando ela tenta chamar `enqueue_push_notification()`, pode estar sendo bloqueada pelas políticas RLS da tabela `push_notification_queue`.

2. **Contexto de segurança**: Mesmo que `enqueue_push_notification()` tenha `SECURITY DEFINER`, se a função que a chama não tiver, pode haver problemas de contexto de segurança.

3. **Search path**: A função pode não estar encontrando corretamente as tabelas e funções necessárias.

## ✅ Solução

O script `fix_invite_created_notifications.sql` corrige o problema:

1. **Adiciona `SECURITY DEFINER`**: A função `trg_invite_created_notify()` agora tem `SECURITY DEFINER`, garantindo que ela possa inserir notificações na fila mesmo com RLS habilitado.

2. **Define `search_path`**: Adiciona `SET search_path = public` para garantir que a função encontre corretamente as tabelas e funções.

3. **Garante políticas RLS**: Verifica e cria as políticas RLS necessárias na tabela `push_notification_queue` (caso não existam).

4. **Verifica o trigger**: Garante que o trigger está ativo e configurado corretamente.

## 📋 Como Aplicar a Correção

1. Execute o script `fix_invite_created_notifications.sql` no SQL Editor do Supabase.

2. Verifique se as notificações estão sendo criadas:
```sql
SELECT 
    id,
    user_id,
    notification_type,
    status,
    created_at,
    payload->>'title' as title,
    payload->>'body' as body
FROM push_notification_queue
WHERE notification_type = 'new_invite'
ORDER BY created_at DESC
LIMIT 10;
```

3. Teste criando um novo convite e verifique se a notificação aparece na fila.

## 🔧 Verificações Adicionais

### 1. Verificar se o trigger está ativo

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'invites'
  AND trigger_name = 'trg_invite_created_notify';
```

### 2. Verificar se a função tem SECURITY DEFINER

```sql
SELECT 
    p.proname AS function_name,
    p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'trg_invite_created_notify'
  AND n.nspname = 'public';
```

O campo `is_security_definer` deve ser `true`.

### 3. Verificar se há subscriptions de push registradas

```sql
SELECT 
    p.user_id,
    p.display_name,
    COUNT(ps.id) as subscription_count
FROM profiles p
LEFT JOIN push_subscriptions ps ON ps.user_id = p.user_id
WHERE p.user_type = 'musician'
GROUP BY p.user_id, p.display_name
ORDER BY subscription_count DESC;
```

### 4. Verificar status das notificações na fila

```sql
SELECT 
    notification_type,
    status,
    COUNT(*) as count
FROM push_notification_queue
GROUP BY notification_type, status
ORDER BY notification_type, status;
```

Se houver muitas notificações com status `pending`, o processador pode não estar rodando.

## 📝 Notas Importantes

- A função `enqueue_push_notification()` já tem `SECURITY DEFINER`, mas a função que a chama também precisa ter para garantir que o contexto de segurança seja correto.
- O uso de `SET search_path = public` garante que a função encontre corretamente as tabelas e funções necessárias.
- Se o processador de fila não estiver rodando, as notificações serão criadas mas não enviadas até que o processador seja executado.

## 🚀 Próximos Passos

Após aplicar a correção:
1. Crie um novo convite e verifique se a notificação aparece na fila
2. Verifique se o processador está enviando as notificações
3. Teste se o músico recebe a notificação push

## 🔗 Relacionado

Este problema é similar ao problema de notificações quando uma gig é publicada. Veja também:
- `fix_gig_published_notifications.sql` - Correção para notificações de gigs publicadas
- `INVESTIGACAO_NOTIFICACOES_GIG_PUBLISHED.md` - Documentação do problema relacionado

