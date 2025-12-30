# 🚀 Configurar Variáveis na Vercel (Produção)

## ⚠️ ERRO: "Invalid API key" em Produção

O erro está acontecendo porque as variáveis de ambiente não estão configuradas na Vercel para o domínio **https://www.chamaomusico.com.br**.

## ✅ SOLUÇÃO: Configurar na Vercel

### Passo 1: Acessar o Dashboard da Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto **chamaomusico** (ou o nome do seu projeto)

### Passo 2: Ir para Environment Variables

1. No menu lateral, clique em **Settings**
2. Clique em **Environment Variables** (ou **Variáveis de Ambiente**)

### Passo 3: Adicionar `NEXT_PUBLIC_SUPABASE_URL`

1. Clique no botão **Add New** (ou **Adicionar Nova**)
2. Preencha:
   - **Name (Nome):** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value (Valor):** `https://irombysdylzmovsthekn.supabase.co`
   - **Environment (Ambiente):** Selecione **TODAS** as opções:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Clique em **Save** (Salvar)

### Passo 4: Adicionar `NEXT_PUBLIC_SUPABASE_ANON_KEY`

1. Clique novamente em **Add New**
2. Preencha:
   - **Name (Nome):** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value (Valor):** `sb_publishable_RsFYZd3-0Thohl7cLt4LcQ_PhmJ5Awp`
     - ⚠️ **IMPORTANTE:** Cole a chave **COMPLETA** do Supabase
     - Deve começar com `sb_publishable_`
     - Deve ter aproximadamente 50-60 caracteres
   - **Environment (Ambiente):** Selecione **TODAS** as opções:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Clique em **Save** (Salvar)

### Passo 5: Fazer Redeploy

**CRÍTICO:** Após adicionar as variáveis, você **DEVE** fazer um novo deploy!

#### Opção A: Redeploy do último deployment

1. Vá em **Deployments** (Implantações)
2. Encontre o último deployment
3. Clique nos **3 pontos** (⋯) no canto superior direito
4. Selecione **Redeploy**
5. Confirme o redeploy

#### Opção B: Novo commit (Recomendado)

1. Faça um pequeno commit (pode ser apenas um espaço em branco):
   ```bash
   git commit --allow-empty -m "Trigger redeploy with env vars"
   git push
   ```
2. A Vercel fará deploy automático

### Passo 6: Aguardar o Deploy

1. Vá em **Deployments**
2. Aguarde o novo deployment terminar (pode levar 2-5 minutos)
3. Verifique se o status está **Ready** (Pronto) e não **Error** (Erro)

### Passo 7: Testar

1. Acesse **https://www.chamaomusico.com.br/login**
2. Tente fazer login
3. O erro "Invalid API key" não deve mais aparecer

## 📋 Checklist

- [ ] Variável `NEXT_PUBLIC_SUPABASE_URL` adicionada na Vercel
- [ ] Variável `NEXT_PUBLIC_SUPABASE_ANON_KEY` adicionada na Vercel
- [ ] Ambas configuradas para **Production, Preview e Development**
- [ ] Redeploy realizado após adicionar as variáveis
- [ ] Deploy concluído com sucesso
- [ ] Testado em produção

## 🔍 Verificar se as Variáveis Estão Configuradas

1. Vá em **Settings** > **Environment Variables**
2. Você deve ver ambas as variáveis listadas
3. Verifique se estão marcadas para **Production** ✅

## ⚠️ IMPORTANTE

- **SEMPRE** faça redeploy após adicionar/alterar variáveis de ambiente
- As variáveis só ficam disponíveis **após** um novo deploy
- Se você adicionar as variáveis mas não fizer redeploy, o erro continuará

## 🚨 Se Ainda Não Funcionar

1. **Verifique os logs do deployment:**
   - Vá em **Deployments** > Clique no último deployment
   - Veja os **Build Logs** para verificar se há erros

2. **Verifique se a chave está completa:**
   - No Supabase Dashboard, copie a chave novamente
   - Certifique-se de que está usando a **Publishable key**, não a Secret key

3. **Limpe o cache do navegador:**
   - Pressione `Ctrl + Shift + R` para fazer hard refresh
   - Ou teste em uma janela anônima

## 📝 Valores Esperados

**NEXT_PUBLIC_SUPABASE_URL:**
```
https://irombysdylzmovsthekn.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY:**
```
sb_publishable_RsFYZd3-0Thohl7cLt4LcQ_PhmJ5Awp
```
(Use a chave completa do seu Supabase Dashboard)

---

**Pronto!** Após configurar as variáveis e fazer o redeploy, o erro deve desaparecer em produção. 🚀

