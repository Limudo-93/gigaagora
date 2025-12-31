# 🔍 Diagnóstico Detalhado do Erro 500

## 🚨 Problema Atual

A Edge Function `send-push-notification` está retornando erro 500, mas não conseguimos ver os detalhes do erro no body da resposta.

## ✅ Melhorias Aplicadas

1. **Logs mais detalhados** no código de processamento
2. **Captura do body de erro** quando disponível
3. **Stack trace completo** nos logs

## 🔧 Passos para Diagnosticar

### Passo 1: Verificar Logs da Edge Function

**IMPORTANTE:** Os logs da Edge Function são a melhor fonte de informação sobre o erro.

1. Acesse: https://supabase.com/dashboard/project/irombysdylzmovsthekn/functions/send-push-notification
2. Vá na aba **Logs**
3. Procure por logs recentes (últimos minutos)
4. Procure por:
   - `[Push Notification] ========== ERRO GERAL CAPTURADO ==========`
   - `[Push Notification] Erro ao chamar webPush.sendNotification:`
   - `[Push Notification] VAPID keys não configuradas`

### Passo 2: Verificar Secrets (Variáveis de Ambiente)

1. Acesse: https://supabase.com/dashboard/project/irombysdylzmovsthekn/settings/functions
2. Vá em **Secrets**
3. Verifique se existem e estão corretas:
   - ✅ `VAPID_PUBLIC_KEY` (deve ter ~87 caracteres)
   - ✅ `VAPID_PRIVATE_KEY` (deve ter ~43 caracteres)
   - ✅ `VAPID_SUBJECT` (ex: `mailto:admin@chamaomusico.com`)

### Passo 3: Verificar Logs do Processador

Os logs do processador agora capturam mais detalhes:

1. Verifique os logs do endpoint `/api/notifications/process` na Vercel
2. Procure por:
   - `[Notifications Process] Failed to send notification:`
   - `[Notifications Process] Full error details:`
   - `[Notifications Process] Error stack:`

### Passo 4: Testar Manualmente a Edge Function

Você pode testar a Edge Function diretamente:

```bash
curl -X POST https://irombysdylzmovsthekn.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/wp/djgq0Hr9mUI:APA91bHn...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    },
    "payload": {
      "title": "Teste",
      "body": "Mensagem de teste"
    }
  }'
```

Isso retornará o erro completo no body da resposta.

## 🔍 Possíveis Causas do Erro 500

### 1. Chaves VAPID Não Configuradas

**Sintoma:** Logs mostram `VAPID_PUBLIC_KEY length: 0`

**Solução:**
- Adicione as chaves nas Secrets do Supabase
- Faça redeploy da Edge Function

### 2. Chaves VAPID Inválidas

**Sintoma:** Erro ao chamar `webPush.sendNotification` com mensagem sobre chaves inválidas

**Solução:**
- Gere novas chaves: `node scripts/generate-vapid-keys.js`
- Atualize as Secrets
- Faça redeploy

### 3. Subscription Inválida ou Expirada

**Sintoma:** Erro do web-push sobre subscription inválida

**Solução:**
- Verifique se a subscription ainda está ativa
- O usuário pode precisar reativar as notificações push

### 4. Erro no web-push Library

**Sintoma:** Erro específico do web-push (ex: "Invalid subscription")

**Solução:**
- Verifique os logs para o erro específico
- Pode ser necessário remover subscriptions expiradas

## 📝 Checklist de Verificação

- [ ] Logs da Edge Function verificados
- [ ] `VAPID_PUBLIC_KEY` existe e tem ~87 caracteres
- [ ] `VAPID_PRIVATE_KEY` existe e tem ~43 caracteres
- [ ] `VAPID_SUBJECT` existe e é um email válido
- [ ] Edge Function foi redeployada após configurar Secrets
- [ ] Logs do processador verificados
- [ ] Teste manual da Edge Function executado

## 🆘 Se Ainda Não Funcionar

1. **Copie os logs completos** da Edge Function (últimos 10-20 logs)
2. **Copie os logs do processador** (últimos 5-10 logs)
3. **Verifique o formato da subscription** que está sendo enviada
4. **Teste com uma subscription conhecida** para isolar o problema

## 📌 Nota Importante

O erro 500 geralmente indica um problema na Edge Function, não no código que a chama. Os logs da Edge Function são essenciais para diagnosticar o problema.

