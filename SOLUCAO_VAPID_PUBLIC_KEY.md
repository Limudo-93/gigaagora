# 🔑 SOLUÇÃO: Configurar VAPID_PUBLIC_KEY no Supabase

## 🚨 Problema Atual (visto nos logs)

```
[Push Notification] Variáveis VAPID carregadas: {
  hasPublicKey: false,        ← ❌ PROBLEMA AQUI
  publicKeyLength: 0,         ← ❌ PROBLEMA AQUI
  hasPrivatekey: true,        ← ✅ OK
  privateKeyLength: 43,       ← ✅ OK
  hasSubject: true,          ← ✅ OK
  subject: "mailto:seu-email@exemplo.com"
}
```

**A chave pública VAPID não está configurada nas Secrets do Supabase!**

## ✅ Solução em 3 Passos

### Passo 1: Obter a Chave Pública VAPID

Você precisa da chave pública VAPID. Ela deve estar no seu `.env.local` como `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

**Se você NÃO tem a chave:**

1. Abra o terminal no diretório do projeto
2. Execute:
   ```bash
   node scripts/generate-vapid-keys.js
   ```
3. Isso mostrará algo como:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNJxwK8vQZ3mNpR5sT7uV9wX1yZ3aB5cD7eF9gH1jK3...
   VAPID_PRIVATE_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234...
   ```

**Copie a chave pública** (a linha que começa com `NEXT_PUBLIC_VAPID_PUBLIC_KEY=`)

### Passo 2: Adicionar no Supabase Dashboard

1. **Acesse o Dashboard:**
   - Vá para: https://supabase.com/dashboard/project/irombysdylzmovsthekn/settings/functions
   - Ou: Settings > Edge Functions > Secrets

2. **Adicionar VAPID_PUBLIC_KEY:**
   - Clique em **"Add new secret"** (ou **"New secret"**)
   - **Name:** Digite exatamente: `VAPID_PUBLIC_KEY`
   - **Value:** Cole a chave pública (sem o `NEXT_PUBLIC_VAPID_PUBLIC_KEY=`, apenas o valor)
   - Clique em **Save** ou **Add**

3. **Verificar se foi adicionada:**
   - Você deve ver `VAPID_PUBLIC_KEY` na lista de Secrets
   - Deve ter 3 Secrets agora:
     - ✅ `VAPID_PUBLIC_KEY` (nova)
     - ✅ `VAPID_PRIVATE_KEY` (já existe)
     - ✅ `VAPID_SUBJECT` (já existe)

### Passo 3: Fazer Redeploy (OBRIGATÓRIO!)

**IMPORTANTE:** Após adicionar a Secret, você DEVE fazer redeploy:

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

**Por quê?** As variáveis de ambiente são carregadas quando a função é deployada. Sem redeploy, a função ainda usará a versão antiga sem a chave.

## ✅ Verificar se Funcionou

Após o redeploy:

1. **Tente enviar uma notificação novamente**
2. **Verifique os logs:**
   - Vá em: Edge Functions > send-push-notification > Logs
   - Procure por: `[Push Notification] Variáveis VAPID carregadas:`
   - Agora deve mostrar:
     ```
     hasPublicKey: true,        ← ✅ CORRIGIDO
     publicKeyLength: 87,        ← ✅ CORRIGIDO (ou similar, ~87 caracteres)
     ```

3. **Se ainda mostrar `hasPublicKey: false`:**
   - Verifique se o nome da Secret está exatamente correto: `VAPID_PUBLIC_KEY` (case-sensitive)
   - Verifique se não há espaços extras no valor
   - **Faça redeploy novamente**

## 🔍 Exemplo de Como Deve Ficar

**Antes (ERRADO):**
```
hasPublicKey: false
publicKeyLength: 0
```

**Depois (CORRETO):**
```
hasPublicKey: true
publicKeyLength: 87
```

## ⚠️ Problemas Comuns

### "Não sei qual é a chave pública"
- Ela está no seu `.env.local` como `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Se não tiver, gere novas com `node scripts/generate-vapid-keys.js`
- **IMPORTANTE:** Se gerar novas, atualize também no `.env.local` e Vercel

### "Adicionei mas ainda mostra false"
- Verifique se o **nome está exatamente correto**: `VAPID_PUBLIC_KEY` (sem espaços, case-sensitive)
- Verifique se o **valor não tem espaços** no início/fim
- **Faça redeploy** após adicionar/atualizar

### "A chave pública é muito longa?"
- Normal! Uma chave pública VAPID tem ~87 caracteres
- É uma string base64, pode ter quebras de linha - remova-as antes de colar

## 📝 Checklist Rápido

- [ ] Chave pública VAPID obtida (do `.env.local` ou gerada)
- [ ] `VAPID_PUBLIC_KEY` adicionada nas Secrets do Supabase
- [ ] Nome da Secret está exatamente correto: `VAPID_PUBLIC_KEY`
- [ ] Valor da Secret não tem espaços extras
- [ ] Redeploy feito após adicionar a Secret
- [ ] Logs verificados e mostram `hasPublicKey: true`
- [ ] Teste de envio realizado

## 🎯 Resultado Esperado

Após seguir todos os passos:
- ✅ Logs mostram `hasPublicKey: true`
- ✅ Erro 500 desaparece
- ✅ Notificações são enviadas com sucesso

---

**Dica:** Se você já tem a chave no `.env.local`, é só copiar o valor de `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e colar na Secret `VAPID_PUBLIC_KEY` do Supabase!

