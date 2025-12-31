# 🔧 Solução: Erro 500 na Edge Function send-push-notification

## 🚨 Problema

A Edge Function está retornando erro 500 ao tentar enviar notificações push.

## ✅ Solução Passo a Passo

### 1. Verificar Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/irombysdylzmovsthekn/functions
2. Clique em `send-push-notification`
3. Vá na aba **Logs**
4. Procure por erros recentes

### 2. Verificar Chaves VAPID nas Secrets

1. Acesse: https://supabase.com/dashboard/project/irombysdylzmovsthekn/settings/functions
2. Vá em **Secrets**
3. Verifique se existem estas 3 Secrets:
   - ✅ `VAPID_PUBLIC_KEY` (deve ter ~87 caracteres)
   - ✅ `VAPID_PRIVATE_KEY` (deve ter ~43 caracteres)
   - ✅ `VAPID_SUBJECT` (ex: `mailto:admin@chamaomusico.com`)

### 3. Se Faltar Alguma Secret

**Obter as chaves:**
- Se você tem no `.env.local`, use-as
- Se não, gere novas: `node scripts/generate-vapid-keys.js`

**Adicionar no Supabase:**
1. Clique em **Add new secret**
2. **Name:** `VAPID_PUBLIC_KEY` (ou `VAPID_PRIVATE_KEY` ou `VAPID_SUBJECT`)
3. **Value:** Cole o valor (sem o nome da variável, apenas o valor)
4. Clique em **Save**

### 4. Fazer Redeploy da Edge Function

**IMPORTANTE:** Após adicionar/atualizar Secrets, você DEVE fazer redeploy:

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

Ou via Dashboard:
1. Vá em **Edge Functions** > **send-push-notification**
2. Clique em **Deploy** ou **Redeploy**

### 5. Verificar se Funcionou

1. Tente enviar uma notificação novamente
2. Verifique os logs da Edge Function
3. Procure por: `[Push Notification] Variáveis VAPID carregadas:`

Deve mostrar:
```
hasPublicKey: true
publicKeyLength: 87 (aproximadamente)
hasPrivateKey: true
privateKeyLength: 43 (aproximadamente)
```

## 🔍 Diagnóstico Adicional

### Verificar Erro Específico nos Logs

Nos logs da Edge Function, procure por:
- `[Push Notification] Erro ao chamar webPush.sendNotification`
- `[Push Notification] VAPID keys não configuradas`
- Qualquer mensagem de erro após `========== ERRO GERAL CAPTURADO ==========`

### Possíveis Causas

1. **Chaves VAPID não configuradas** → Adicione nas Secrets
2. **Chaves VAPID inválidas** → Gere novas chaves
3. **Subscription inválida** → Verifique se a subscription está correta
4. **Erro no web-push** → Verifique os logs para detalhes específicos

## 📝 Checklist

- [ ] Logs da Edge Function verificados
- [ ] `VAPID_PUBLIC_KEY` existe nas Secrets
- [ ] `VAPID_PRIVATE_KEY` existe nas Secrets
- [ ] `VAPID_SUBJECT` existe nas Secrets
- [ ] Edge Function foi redeployada após adicionar Secrets
- [ ] Testou enviar notificação novamente
- [ ] Verificou logs após o teste

## 🆘 Se Ainda Não Funcionar

1. **Copie os logs completos** da Edge Function
2. **Verifique o formato das chaves VAPID** (devem ser base64 URL-safe)
3. **Teste com uma subscription conhecida** para isolar o problema

