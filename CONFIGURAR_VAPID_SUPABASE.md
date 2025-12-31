# 🔑 Como Configurar VAPID Keys no Supabase (SOLUÇÃO DO ERRO 500)

## 🚨 Problema Identificado

Os logs mostram claramente:
- ❌ `VAPID_PUBLIC_KEY presente: false`
- ❌ `VAPID_PUBLIC_KEY length: 0`
- ✅ `VAPID_PRIVATE_KEY presente: true` (mas pode estar incompleta)
- ⚠️ `VAPID_SUBJECT: mailto:seu-email@exemplo.com` (placeholder)

**A chave pública VAPID não está configurada nas Secrets do Supabase!**

## ✅ Solução Passo a Passo

### Passo 1: Gerar ou Obter as Chaves VAPID

Se você já tem as chaves no `.env.local`, use-as. Caso contrário, gere novas:

```bash
node scripts/generate-vapid-keys.js
```

Isso mostrará algo como:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNJxwK8v...
VAPID_PRIVATE_KEY=abc123def456...
VAPID_SUBJECT=mailto:seu-email@exemplo.com
```

**IMPORTANTE:** 
- A chave **pública** é a mesma que você usa em `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- A chave **privada** é a mesma que você usa em `VAPID_PRIVATE_KEY`
- O **subject** deve ser um email válido (ex: `mailto:admin@chamaomusico.com`)

### Passo 2: Configurar no Supabase Dashboard

1. **Acesse o Dashboard do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: `irombysdylzmovsthekn`

2. **Navegue até as Secrets:**
   - Vá em **Settings** (Configurações)
   - Clique em **Edge Functions**
   - Clique em **Secrets** (ou procure por "Secrets" na barra lateral)

3. **Adicione/Atualize as 3 variáveis:**

   **a) VAPID_PUBLIC_KEY:**
   - Clique em **Add new secret** (ou edite se já existir)
   - **Name:** `VAPID_PUBLIC_KEY`
   - **Value:** Cole a chave pública (a mesma de `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
   - Clique em **Save**

   **b) VAPID_PRIVATE_KEY:**
   - Clique em **Add new secret**
   - **Name:** `VAPID_PRIVATE_KEY`
   - **Value:** Cole a chave privada (a mesma de `VAPID_PRIVATE_KEY`)
   - Clique em **Save**

   **c) VAPID_SUBJECT:**
   - Clique em **Add new secret**
   - **Name:** `VAPID_SUBJECT`
   - **Value:** `mailto:seu-email@exemplo.com` (substitua por um email real)
   - Clique em **Save**

### Passo 3: Fazer Redeploy da Função

**IMPORTANTE:** Após adicionar/atualizar as Secrets, você **DEVE** fazer redeploy da função:

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

Isso é necessário porque as variáveis de ambiente são carregadas quando a função é deployada.

### Passo 4: Verificar se Funcionou

1. **Tente enviar uma notificação novamente**
2. **Verifique os logs no Dashboard:**
   - Vá em **Edge Functions** > **send-push-notification** > **Logs**
   - Procure por: `[Push Notification] Variáveis VAPID carregadas:`
   - Agora deve mostrar:
     - ✅ `hasPublicKey: true`
     - ✅ `publicKeyLength: 87` (ou similar, ~87 caracteres)
     - ✅ `hasPrivateKey: true`
     - ✅ `privateKeyLength: 43` (ou similar, ~43 caracteres)

3. **Se ainda houver erro:**
   - Verifique se as chaves estão corretas (sem espaços extras)
   - Verifique se o redeploy foi feito após adicionar as Secrets
   - Verifique os logs para ver qual é o novo erro

## 🔍 Verificação Rápida

Após configurar, os logs devem mostrar:

```
[Push Notification] Variáveis VAPID carregadas: {
  hasPublicKey: true,
  publicKeyLength: 87,
  hasPrivateKey: true,
  privateKeyLength: 43,
  hasSubject: true,
  subject: "mailto:seu-email@exemplo.com"
}
```

Se você ainda ver `hasPublicKey: false` ou `publicKeyLength: 0`, significa que:
- A Secret não foi adicionada corretamente, OU
- O redeploy não foi feito após adicionar a Secret

## ⚠️ Problemas Comuns

### "A Secret já existe mas não está funcionando"
- Verifique se o **nome está exatamente correto**: `VAPID_PUBLIC_KEY` (case-sensitive)
- Verifique se não há espaços extras no início/fim do valor
- **Faça redeploy** após atualizar a Secret

### "Não sei qual é a chave pública"
- A chave pública é a mesma que você usa em `NEXT_PUBLIC_VAPID_PUBLIC_KEY` no `.env.local`
- Se você não tem, gere novas chaves com `node scripts/generate-vapid-keys.js`
- **IMPORTANTE:** Se gerar novas chaves, você precisará atualizar também no `.env.local` e no Vercel

### "A chave privada tem length 39, isso está correto?"
- Uma chave privada VAPID válida geralmente tem ~43 caracteres (base64)
- Se tem 39, pode estar incompleta ou mal formatada
- Gere novas chaves se necessário

## 📝 Checklist Final

- [ ] Chaves VAPID geradas ou obtidas
- [ ] `VAPID_PUBLIC_KEY` adicionada nas Secrets do Supabase
- [ ] `VAPID_PRIVATE_KEY` adicionada nas Secrets do Supabase
- [ ] `VAPID_SUBJECT` adicionada nas Secrets do Supabase (com email real)
- [ ] Redeploy da função feito após adicionar as Secrets
- [ ] Logs verificados e mostram `hasPublicKey: true`
- [ ] Teste de envio de notificação realizado

## 🎯 Próximos Passos

Após configurar corretamente:
1. Os logs devem mostrar que as chaves estão carregadas
2. O erro 500 deve desaparecer
3. As notificações devem ser enviadas com sucesso

Se ainda houver problemas após seguir todos os passos, verifique os logs para identificar o próximo erro específico.

