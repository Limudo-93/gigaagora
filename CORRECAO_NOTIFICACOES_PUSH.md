# Correção: Notificações Push Não Funcionam

## Problema Identificado

As notificações push não estavam sendo disparadas quando eventos aconteciam na aplicação (criação de gigs, convites, etc.). O problema tinha várias causas:

1. **Falta de Cron Job**: O endpoint `/api/notifications/process` não estava sendo chamado automaticamente
2. **Dependência de pg_net**: O sistema dependia de `pg_net` (extensão do Supabase) que pode não estar disponível
3. **Falta de Logs**: Não havia logs suficientes para diagnosticar problemas
4. **Processamento não automático**: As notificações eram enfileiradas mas não processadas imediatamente

## Soluções Implementadas

### 1. Configuração de Cron Job (vercel.json)

Adicionado cron job que processa a fila de notificações a cada 2 minutos:

```json
{
  "crons": [
    {
      "path": "/api/notifications/process",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

### 2. Melhorias no Endpoint de Processamento

- Adicionados logs detalhados para debug
- Melhorado tratamento de erros
- Melhorada autorização (permite cron da Vercel e chamadas com secret)

### 3. Script SQL de Melhorias (fix_push_notifications_processing.sql)

O script SQL implementa:

- **Melhoria em `try_notify_queue_processor()`**: 
  - Adiciona `SECURITY DEFINER` e `SET search_path`
  - Melhor tratamento de erros
  - Suporte a configuração via variáveis de ambiente do PostgreSQL

- **Melhoria em `enqueue_push_notification()`**:
  - Evita duplicatas verificando se já existe notificação com mesmo `event_key`
  - Melhor tratamento de conflitos

- **Novo Trigger `trg_notification_enqueued_process()`**:
  - Tenta processar imediatamente após inserção de notificação
  - Chama `try_notify_queue_processor()` automaticamente

- **Verificação de SECURITY DEFINER**:
  - Garante que todas as funções de trigger têm `SECURITY DEFINER`

- **Políticas RLS**:
  - Verifica e cria políticas RLS necessárias se não existirem

## Como Aplicar as Correções

### Passo 1: Executar Script SQL

1. Acesse o SQL Editor no Supabase
2. Execute o arquivo `fix_push_notifications_processing.sql`
3. Verifique se não há erros

### Passo 2: Fazer Deploy

1. Faça commit das mudanças no `vercel.json` e `src/app/api/notifications/process/route.ts`
2. Faça deploy na Vercel
3. O cron job será configurado automaticamente

### Passo 3: Verificar Configuração

Após o deploy, verifique:

1. **Cron Job**: Acesse o dashboard da Vercel e verifique se o cron job está ativo
2. **Logs**: Verifique os logs do endpoint `/api/notifications/process` na Vercel
3. **Fila de Notificações**: Execute no Supabase:

```sql
SELECT 
    notification_type,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM push_notification_queue
GROUP BY notification_type, status
ORDER BY notification_type, status;
```

## Como Testar

### Teste 1: Criar uma Nova Gig

1. Crie uma nova gig e publique
2. Verifique se notificações são criadas na fila:

```sql
SELECT 
    id,
    user_id,
    notification_type,
    status,
    created_at,
    next_attempt_at
FROM push_notification_queue
WHERE notification_type = 'gig_published'
ORDER BY created_at DESC
LIMIT 10;
```

3. Aguarde até 2 minutos (ou force processamento manualmente)
4. Verifique se o status mudou para 'sent':

```sql
SELECT 
    id,
    status,
    sent_at,
    last_error,
    attempt_count
FROM push_notification_queue
WHERE notification_type = 'gig_published'
ORDER BY created_at DESC
LIMIT 10;
```

### Teste 2: Criar um Novo Convite

1. Crie um novo convite para um músico
2. Verifique se notificação é criada:

```sql
SELECT 
    id,
    user_id,
    notification_type,
    status,
    payload->>'title' as title,
    payload->>'body' as body
FROM push_notification_queue
WHERE notification_type = 'new_invite'
ORDER BY created_at DESC
LIMIT 5;
```

3. Aguarde processamento e verifique se foi enviada

### Teste 3: Processamento Manual

Você pode forçar o processamento manualmente fazendo uma requisição:

```bash
# Com secret configurado
curl -X POST https://www.chamaomusico.com.br/api/notifications/process \
  -H "Authorization: Bearer SEU_SECRET_AQUI"

# Ou via GET (se não tiver secret configurado)
curl https://www.chamaomusico.com.br/api/notifications/process
```

## Verificações de Diagnóstico

### Verificar Subscriptions Ativas

```sql
SELECT 
    p.user_id,
    p.display_name,
    COUNT(ps.id) as subscription_count
FROM profiles p
LEFT JOIN push_subscriptions ps ON ps.user_id = p.user_id AND ps.active = true
WHERE p.user_type = 'musician'
GROUP BY p.user_id, p.display_name
ORDER BY subscription_count DESC;
```

### Verificar Notificações Pendentes

```sql
SELECT 
    notification_type,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60) as avg_age_minutes
FROM push_notification_queue
WHERE status IN ('pending', 'retry')
GROUP BY notification_type, status;
```

### Verificar Erros Recentes

```sql
SELECT 
    id,
    notification_type,
    status,
    attempt_count,
    last_error,
    created_at,
    last_attempt_at
FROM push_notification_queue
WHERE last_error IS NOT NULL
ORDER BY last_attempt_at DESC
LIMIT 20;
```

## Troubleshooting

### Notificações não são processadas

1. Verifique se o cron job está ativo na Vercel
2. Verifique os logs do endpoint `/api/notifications/process`
3. Verifique se há notificações pendentes na fila
4. Verifique se os usuários têm subscriptions ativas

### Notificações são criadas mas não enviadas

1. Verifique se a Edge Function `send-push-notification` está deployada no Supabase
2. Verifique se as chaves VAPID estão configuradas corretamente
3. Verifique os logs da Edge Function no Supabase
4. Verifique se há erros na coluna `last_error` da tabela `push_notification_queue`

### Cron job não está rodando

1. Verifique se o `vercel.json` foi commitado e deployado
2. Verifique no dashboard da Vercel se o cron job aparece
3. Verifique se a URL do endpoint está correta
4. Tente fazer uma chamada manual para testar

## Próximos Passos

1. **Monitoramento**: Configure alertas para quando há muitas notificações pendentes
2. **Métricas**: Adicione métricas de sucesso/falha de envio
3. **Retry Logic**: Melhore a lógica de retry para notificações que falham
4. **Rate Limiting**: Adicione rate limiting para evitar sobrecarga

## Arquivos Modificados

- `vercel.json`: Adicionado cron job
- `src/app/api/notifications/process/route.ts`: Melhorias com logs e tratamento de erros
- `fix_push_notifications_processing.sql`: Script SQL com todas as melhorias

## Notas Importantes

- O cron job processa a fila a cada 2 minutos. Notificações podem ter um delay de até 2 minutos.
- Se `pg_net` não estiver disponível, o sistema ainda funcionará via cron job.
- O processamento imediato via `try_notify_queue_processor()` é uma otimização, mas o cron job garante que todas as notificações sejam processadas eventualmente.

