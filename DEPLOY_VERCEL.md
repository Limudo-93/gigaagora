# 🚀 Guia de Deploy na Vercel

Este guia vai te ajudar a fazer o deploy do **Chama o Músico** na Vercel.

## 📋 Pré-requisitos

1. ✅ Conta na [Vercel](https://vercel.com) (pode usar GitHub, GitLab ou email)
2. ✅ Projeto no GitHub/GitLab/Bitbucket (recomendado) ou pode fazer deploy direto
3. ✅ Variáveis de ambiente do Supabase configuradas

---

## 🔧 Passo 1: Preparar o Projeto

### 1.1 Verificar Build Local

Antes de fazer deploy, teste o build localmente:

```bash
npm run build
```

Se houver erros, corrija antes de continuar.

### 1.2 Verificar Arquivos Importantes

Certifique-se de que estes arquivos existem:
- ✅ `package.json` (com scripts de build)
- ✅ `next.config.mjs`
- ✅ `.gitignore` (com `node_modules`, `.env.local`, etc.)

---

## 🌐 Passo 2: Criar Projeto na Vercel

### Opção A: Deploy via Dashboard (Recomendado)

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. **Importe seu repositório Git:**
   - Se seu código está no GitHub/GitLab, conecte a conta
   - Selecione o repositório `gigaagora`
4. **Configure o projeto:**
   - **Framework Preset:** Next.js (deve detectar automaticamente)
   - **Root Directory:** `./` (raiz)
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `.next` (padrão)
   - **Install Command:** `npm install` (padrão)

### Opção B: Deploy via CLI

1. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

2. No diretório do projeto, execute:
```bash
vercel
```

3. Siga as instruções:
   - Login na Vercel
   - Link ao projeto existente ou criar novo
   - Confirme as configurações

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### 3.1 Variáveis Necessárias

No dashboard da Vercel, vá em **Settings** > **Environment Variables** e adicione:

#### Variáveis Obrigatórias:

```env
NEXT_PUBLIC_SUPABASE_URL=https://irombysdylzmovsthekn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RsFYZd3-0Thohl7cLt4LcQ_PhmJ5Awp
```

> ⚠️ **IMPORTANTE:** Use as chaves do seu projeto Supabase. As acima são apenas exemplos do arquivo `env.download`.

### 3.2 Como Adicionar:

1. No dashboard da Vercel, vá em **Settings** > **Environment Variables**
2. Clique em **Add New**
3. Para cada variável:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** Sua URL do Supabase
   - **Environment:** Selecione todas (Production, Preview, Development)
4. Repita para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.3 Verificar Variáveis

Após adicionar, certifique-se de que estão disponíveis em:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

## 🎯 Passo 4: Configurar Supabase para Produção

### 4.1 URLs de Redirect no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Vá em **Authentication** > **URL Configuration**
3. Adicione as URLs da Vercel:

**Site URL:**
```
https://seu-projeto.vercel.app
```

**Redirect URLs:**
```
https://seu-projeto.vercel.app/auth/callback
https://seu-projeto.vercel.app/dashboard
https://seu-projeto.vercel.app/login
```

> 💡 **Dica:** A Vercel fornece uma URL automática como `gigaagora-xyz123.vercel.app`. Você pode usar essa ou configurar um domínio customizado depois.

### 4.2 Configurar OAuth (Google/Facebook)

Se você usa login social, também precisa adicionar a URL da Vercel:

#### Google Cloud Console:
1. Vá em **APIs & Services** > **Credentials**
2. Edite seu OAuth Client ID
3. Em **Authorized JavaScript origins**, adicione:
   ```
   https://seu-projeto.vercel.app
   ```

#### Facebook Developers:
1. Vá em **Facebook Login** > **Settings**
2. Em **Valid OAuth Redirect URIs**, a URL do callback continua sendo do Supabase:
   ```
   https://[PROJECT-REF].supabase.co/auth/v1/callback
   ```
   (Não precisa mudar, o Supabase já está configurado)

---

## 🚀 Passo 5: Fazer o Deploy

### Via Dashboard:
1. Após configurar tudo, clique em **Deploy**
2. A Vercel vai:
   - Instalar dependências
   - Fazer o build
   - Fazer o deploy

### Via CLI:
```bash
vercel --prod
```

### Via Git (Automático):
Se conectou um repositório Git, cada push na branch principal vai fazer deploy automaticamente.

---

## ✅ Passo 6: Verificar o Deploy

1. **Aguarde o build terminar** (pode levar 2-5 minutos)
2. **Acesse a URL fornecida** pela Vercel
3. **Teste funcionalidades principais:**
   - ✅ Login/Cadastro
   - ✅ Dashboard
   - ✅ Criação de Gigs
   - ✅ Mensagens
   - ✅ OAuth (se configurado)

---

## 🔍 Passo 7: Troubleshooting

### Erro: "Environment variables not found"

**Solução:**
- Verifique se adicionou as variáveis no dashboard da Vercel
- Certifique-se de que selecionou todos os ambientes (Production, Preview, Development)
- Faça um novo deploy após adicionar variáveis

### Erro: "Build failed"

**Solução:**
1. Veja os logs de build na Vercel
2. Teste o build localmente: `npm run build`
3. Verifique se todas as dependências estão no `package.json`
4. Verifique erros de TypeScript/ESLint

### Erro: "Redirect URI mismatch" (OAuth)

**Solução:**
- Adicione a URL da Vercel nas configurações do Google/Facebook
- Adicione a URL da Vercel no Supabase (Authentication > URL Configuration)

### Erro: "Module not found"

**Solução:**
- Verifique se todos os arquivos estão commitados no Git
- Verifique se o `.gitignore` não está ignorando arquivos necessários
- Execute `npm install` localmente e verifique se funciona

---

## 🌍 Passo 8: Configurar Domínio Customizado (Opcional)

1. No dashboard da Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções da Vercel
4. Atualize as URLs no Supabase e Google/Facebook

---

## 📝 Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Build local funciona (`npm run build`)
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] URLs do Supabase atualizadas com a URL da Vercel
- [ ] OAuth configurado (se usar login social)
- [ ] Deploy concluído com sucesso
- [ ] Testes básicos funcionando na URL de produção
- [ ] Logs sem erros críticos

---

## 🎉 Pronto!

Seu projeto está no ar! A Vercel vai fazer deploy automático sempre que você fizer push na branch principal.

### Links Úteis:
- [Documentação Vercel](https://vercel.com/docs)
- [Next.js na Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Supabase + Vercel](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

## 💡 Dicas Extras

1. **Preview Deploys:** A Vercel cria um preview para cada PR/push, útil para testar antes de ir para produção
2. **Analytics:** Ative Vercel Analytics para monitorar performance
3. **Logs:** Use o dashboard da Vercel para ver logs em tempo real
4. **Rollback:** Se algo der errado, você pode fazer rollback para uma versão anterior

