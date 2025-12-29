# 🔐 Configurar Variáveis de Ambiente na Vercel

## ⚠️ ERRO ATUAL

O build está falhando porque as variáveis de ambiente do Supabase não estão configuradas na Vercel.

**Erro:** `@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Obter as Variáveis do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie os seguintes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Passo 2: Adicionar na Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto `chamaomusico`
3. Vá em **Settings** > **Environment Variables**
4. Clique em **Add New**

#### Adicionar `NEXT_PUBLIC_SUPABASE_URL`:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Cole a URL do seu projeto Supabase (ex: `https://xxxxx.supabase.co`)
- **Environment:** Selecione todas as opções:
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- Clique em **Save**

#### Adicionar `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Cole a chave `anon public` do Supabase
- **Environment:** Selecione todas as opções:
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- Clique em **Save**

### Passo 3: Fazer Novo Deploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **3 pontos** (⋯) no último deployment
3. Selecione **Redeploy**
4. Ou faça um novo commit e push (a Vercel fará deploy automático)

## 📋 Checklist

- [ ] Variável `NEXT_PUBLIC_SUPABASE_URL` adicionada
- [ ] Variável `NEXT_PUBLIC_SUPABASE_ANON_KEY` adicionada
- [ ] Ambas configuradas para Production, Preview e Development
- [ ] Novo deploy realizado
- [ ] Build concluído com sucesso

## 🔍 Verificar se Funcionou

Após o deploy, verifique os logs:
- ✅ Build deve completar sem erros
- ✅ Não deve aparecer mais o erro sobre variáveis de ambiente
- ✅ A aplicação deve carregar normalmente

## 💡 Dica

Se você já tem um arquivo `.env.local` localmente, pode copiar os valores de lá, mas **NUNCA** faça commit do arquivo `.env.local` no Git!

---

**Pronto!** Após configurar as variáveis e fazer o redeploy, o build deve funcionar. 🚀

