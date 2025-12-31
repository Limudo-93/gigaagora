# 🔍 Como Debugar a Edge Function de Notificações

## Problema: "Edge Function returned a non-2xx status code"

Se você está recebendo esse erro, siga estes passos para identificar o problema:

## 1. Verificar Logs da Edge Function

### No Supabase Dashboard:
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Edge Functions** > **send-push-notification**
4. Clique na aba **Logs**
5. Procure por erros recentes (últimos minutos/horas)

### Via Dashboard:
1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_REF]/functions/send-push-notification
2. Verifique métricas e logs na página da função

**Importante:** Se "Worker Logs: 0", a função não está executando código (falha na inicialização)

## 2. Verificar Variáveis de Ambiente (Secrets)

Certifique-se de que as seguintes variáveis estão configuradas no Supabase Dashboard:

1. Acesse **Settings** > **Edge Functions** > **Secrets**
2. Verifique se existem:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

**Importante:** Essas variáveis devem ser as mesmas que você configurou no `.env.local`:
- `VAPID_PUBLIC_KEY` = `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` = `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` = `VAPID_SUBJECT` (ou `mailto:seu@email.com`)

## 3. Erros Comuns e Soluções

### Erro: "VAPID keys não configuradas"
- **Causa:** As variáveis VAPID não estão configuradas nas Secrets
- **Solução:** Configure as variáveis no Supabase Dashboard (Settings > Edge Functions > Secrets)

### Erro: "Invalid VAPID key"
- **Causa:** As chaves VAPID estão incorretas ou mal formatadas
- **Solução:** 
  1. Gere novas chaves: `node scripts/generate-vapid-keys.js`
  2. Atualize as Secrets no Supabase Dashboard
  3. Atualize o `.env.local`

### Erro: "Subscription incompleta"
- **Causa:** A subscription não tem todos os campos necessários (endpoint, p256dh, auth)
- **Solução:** Verifique se o registro da subscription está funcionando corretamente

### Erro: "Failed to send notification" (web-push)
- **Causa:** Problema ao enviar a notificação para o serviço push
- **Solução:** 
  - Verifique se as chaves VAPID estão corretas
  - Verifique se a subscription ainda é válida
  - Tente registrar uma nova subscription

## 4. Testar a Edge Function Localmente

Você pode testar a função localmente antes de fazer deploy:

```bash
# Iniciar Supabase localmente (se tiver configurado)
npx supabase start

# Executar função localmente
npx supabase functions serve send-push-notification --no-verify-jwt
```

## 5. Verificar o Código da API Route

O código em `src/app/api/notifications/send/route.ts` agora tem logs mais detalhados. Verifique o console do servidor (terminal onde o Next.js está rodando) para ver mensagens de erro específicas.

## 6. Checklist de Diagnóstico

- [ ] Edge Function foi deployada com sucesso?
- [ ] Variáveis VAPID estão configuradas nas Secrets do Supabase?
- [ ] As chaves VAPID são as mesmas no `.env.local` e no Supabase?
- [ ] Os logs da Edge Function mostram algum erro específico?
- [ ] A subscription do usuário está ativa no banco de dados?
- [ ] O formato da subscription está correto (endpoint, p256dh, auth)?

## 7. Próximos Passos

Após verificar os logs e identificar o erro específico:
1. Se for erro de VAPID keys: Configure as Secrets no Supabase
2. Se for erro de subscription: Verifique o registro de subscriptions
3. Se for erro de formato: Verifique o código que envia a subscription para a Edge Function

