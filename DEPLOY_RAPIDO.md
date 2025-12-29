# ⚡ Deploy Rápido na Vercel

## 🎯 Passos Rápidos

### 1. Acesse a Vercel
👉 [vercel.com](https://vercel.com) → Login com GitHub

### 2. Importe o Projeto
- Clique em **"Add New Project"**
- Conecte seu repositório GitHub (se ainda não conectou)
- Selecione o repositório `gigaagora`
- Clique em **Import**

### 3. Configure Variáveis de Ambiente
No dashboard da Vercel, vá em **Settings** > **Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://irombysdylzmovsthekn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RsFYZd3-0Thohl7cLt4LcQ_PhmJ5Awp
```

> ⚠️ **Use suas próprias chaves do Supabase!** As acima são apenas exemplos.

**Importante:** Selecione todas as opções (Production, Preview, Development)

### 4. Deploy
- Clique em **Deploy**
- Aguarde 2-5 minutos
- Pronto! 🎉

### 5. Configurar Supabase
Após o deploy, você receberá uma URL como: `https://gigaagora-xyz.vercel.app`

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá em **Authentication** > **URL Configuration**
3. Adicione:
   - **Site URL:** `https://seu-projeto.vercel.app`
   - **Redirect URLs:**
     - `https://seu-projeto.vercel.app/auth/callback`
     - `https://seu-projeto.vercel.app/dashboard`
     - `https://seu-projeto.vercel.app/login`

### 6. Se usar OAuth (Google/Facebook)
Adicione a URL da Vercel nas configurações do Google/Facebook também.

---

## ✅ Pronto!

Seu projeto está no ar! Cada push no GitHub vai fazer deploy automático.

---

## 🆘 Problemas?

Veja o guia completo em `DEPLOY_VERCEL.md`

