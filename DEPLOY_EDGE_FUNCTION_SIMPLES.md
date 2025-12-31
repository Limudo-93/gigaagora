# 🚀 Deploy Rápido da Edge Function (Método Simples)

## ⚡ Usando npx (Não precisa instalar nada!)

Este é o método mais simples - você não precisa instalar o Supabase CLI globalmente.

### Passo 1: Login no Supabase

```bash
npx supabase login
```

Isso abrirá seu navegador para fazer login. Após login, você receberá um token.

### Passo 2: Link do Projeto

```bash
npx supabase link --project-ref seu-project-ref
```

**Como encontrar o project-ref:**
- Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
- Selecione seu projeto
- Na URL você verá algo como: `https://supabase.com/dashboard/project/abcdefghijklmnop`
- O `project-ref` é a parte `abcdefghijklmnop`

### Passo 3: Configurar Variáveis VAPID no Supabase Dashboard

**IMPORTANTE:** As variáveis VAPID devem estar configuradas no Supabase Dashboard!

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **Edge Functions** > **Secrets**
4. Clique em **Add new secret**
5. Adicione as seguintes variáveis:
   - **Name:** `VAPID_PUBLIC_KEY`
     **Value:** (sua chave pública VAPID - a mesma de `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
   - **Name:** `VAPID_PRIVATE_KEY`
     **Value:** (sua chave privada VAPID)
   - **Name:** `VAPID_SUBJECT`
     **Value:** `mailto:seu@email.com`

### Passo 4: Deploy da Function

**IMPORTANTE**: Para notificações push que vêm do servidor (não diretamente do cliente), você pode fazer deploy sem verificação JWT:

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

⚠️ **Por que `--no-verify-jwt`?**
- A chamada já vem do servidor Next.js (que já autenticou o usuário)
- A função não precisa verificar o token JWT novamente
- Isso evita erros 401 (Unauthorized)

**Alternativa (se quiser manter autenticação):**
```bash
npx supabase functions deploy send-push-notification
```
Mas você precisará garantir que o token está sendo passado corretamente.

### Passo 5: Verificar

Após o deploy, você pode verificar:
1. No Supabase Dashboard: **Edge Functions** > **send-push-notification**
2. Testar enviando uma notificação pela página `/notifications`

## ✅ Pronto!

Agora as notificações push devem funcionar corretamente! 🎉

