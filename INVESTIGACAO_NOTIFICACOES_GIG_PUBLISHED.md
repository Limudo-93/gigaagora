# Investigação: Notificações Push não são enviadas quando uma nova gig é criada

## 🔍 Problema Identificado

Quando uma nova gig é criada e publicada, os músicos que podem aceitar a gig **não recebem notificações push**.

## 🐛 Causa Raiz

A função `trg_gig_published_notify()` está fazendo um **INSERT direto** na tabela `push_notification_queue` (linha 326 do arquivo `create_push_notifications_queue.sql`), em vez de usar a função `enqueue_push_notification()`.

### Problemas específicos:

1. **RLS (Row Level Security)**: A tabela `push_notification_queue` tem RLS habilitado. O INSERT direto não tem `SECURITY DEFINER`, então pode estar sendo bloqueado pelas políticas RLS, mesmo que elas permitam INSERT.

2. **Processamento imediato**: O INSERT direto não chama `try_notify_queue_processor()`, que notifica o processador de fila imediatamente. Isso significa que mesmo que as notificações sejam inseridas, elas podem não ser processadas imediatamente.

3. **Tratamento de conflitos**: O INSERT direto usa `ON CONFLICT (user_id, event_key) DO NOTHING`, mas a função `enqueue_push_notification()` já trata isso corretamente com `ON CONFLICT ... DO UPDATE`.

## ✅ Solução

O script `fix_gig_published_notifications.sql` corrige o problema:

1. **Garante políticas RLS corretas**: Cria políticas que permitem INSERT e UPDATE para usuários autenticados e service_role.

2. **Modifica a função `trg_gig_published_notify()`**:
   - Adiciona `SECURITY DEFINER` para contornar RLS corretamente
   - Substitui o INSERT direto por chamadas a `enqueue_push_notification()`
   - Usa um loop para notificar cada músico individualmente
   - Garante que o processador de fila seja notificado imediatamente

3. **Verifica o trigger**: Garante que o trigger está ativo e configurado corretamente.

## 📋 Como Aplicar a Correção

1. Execute o script `fix_gig_published_notifications.sql` no SQL Editor do Supabase.

2. Verifique se as notificações estão sendo criadas:
```sql
SELECT 
    id,
    user_id,
    notification_type,
    status,
    created_at,
    payload->>'title' as title
FROM push_notification_queue
WHERE notification_type = 'gig_published'
ORDER BY created_at DESC
LIMIT 10;
```

3. Verifique se os músicos têm subscriptions de push registradas:
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

## 🔧 Verificações Adicionais

### 1. Verificar se o processador de fila está funcionando

O endpoint `/api/notifications/process` deve estar sendo chamado automaticamente quando uma notificação é inserida (via `try_notify_queue_processor()`), ou pode ser chamado manualmente via cron job.

### 2. Verificar se os músicos têm permissões de notificação

Os músicos precisam:
- Ter permissão de notificações concedida no navegador
- Ter um Service Worker registrado
- Ter uma subscription de push registrada no banco de dados

### 3. Verificar logs do processador

Se as notificações estão sendo criadas mas não enviadas, verifique:
- Logs do endpoint `/api/notifications/process`
- Logs da Edge Function `send-push-notification`
- Status das notificações na tabela `push_notification_queue`

## 📝 Notas Importantes

- A função `enqueue_push_notification()` já tem `SECURITY DEFINER`, então ela pode inserir na tabela mesmo com RLS habilitado.
- O uso de `enqueue_push_notification()` garante que o processador de fila seja notificado imediatamente via `try_notify_queue_processor()`.
- Se `pg_net` não estiver disponível, o processador ainda será chamado via cron job ou manualmente.

## 🚀 Próximos Passos

Após aplicar a correção:
1. Crie uma nova gig e verifique se as notificações aparecem na fila
2. Verifique se o processador está enviando as notificações
3. Teste se os músicos recebem as notificações push

