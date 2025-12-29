# 🔐 Configurar Variáveis de Ambiente Localmente

## ⚠️ ERRO: "Invalid API key"

Este erro ocorre quando as variáveis de ambiente do Supabase não estão configuradas localmente.

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Criar arquivo `.env.local`

Na raiz do projeto, crie um arquivo chamado `.env.local` (se ainda não existir).

### Passo 2: Obter as Variáveis do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie os seguintes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Passo 3: Adicionar no `.env.local`

Abra o arquivo `.env.local` e adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
```

**Substitua** `https://seu-projeto.supabase.co` e `sua-chave-anon-key-aqui` pelos valores reais do seu projeto Supabase.

### Passo 4: Reiniciar o Servidor de Desenvolvimento

Após criar/editar o `.env.local`:

1. **Pare o servidor** (Ctrl+C no terminal)
2. **Inicie novamente:**
   ```bash
   npm run dev
   ```

> ⚠️ **IMPORTANTE:** O Next.js só carrega variáveis de ambiente quando o servidor é iniciado. Sempre reinicie após alterar o `.env.local`.

## 📋 Exemplo Completo

Seu arquivo `.env.local` deve ficar assim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://irombysdylzmovsthekn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-real-aqui
```

## 🔍 Verificar se Funcionou

1. Reinicie o servidor
2. Acesse a página de login
3. Tente fazer login
4. O erro "Invalid API key" não deve mais aparecer

## 💡 Dicas

- ✅ O arquivo `.env.local` está no `.gitignore`, então não será commitado no Git
- ✅ Nunca compartilhe suas chaves do Supabase publicamente
- ✅ Se você já tem um arquivo `.env.local`, verifique se as variáveis estão corretas

---

**Pronto!** Após configurar as variáveis e reiniciar o servidor, o erro deve desaparecer. 🚀

