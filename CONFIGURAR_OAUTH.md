# 🔐 Guia de Configuração de Login Social (OAuth)

Este guia explica como configurar o login via Google e Facebook no Supabase.

## 📋 Pré-requisitos

- Conta no Supabase
- Conta no Google Cloud Console (para Google OAuth)
- Conta no Facebook Developers (para Facebook OAuth)
- Aplicação já configurada no Supabase

---

## 🔵 Configuração do Google OAuth

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**

### Passo 2: Configurar OAuth Consent Screen

1. Se ainda não configurado, vá em **OAuth consent screen**
2. Escolha **External** (para testes) ou **Internal** (para organização)
3. Preencha:
   - **App name**: Chama o Músico (ou o nome da sua aplicação)
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
4. Clique em **Save and Continue**
5. Adicione scopes (opcional):
   - `email`
   - `profile`
   - `openid`
6. Adicione test users (se necessário)
7. Revise e salve

### Passo 3: Criar OAuth Client ID

1. Vá em **Credentials** > **Create Credentials** > **OAuth client ID**
2. Selecione **Web application**
3. Configure:
   - **Name**: Chama o Músico Web
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://seudominio.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     > **Importante**: Substitua `[SEU-PROJECT-REF]` pelo ID do seu projeto Supabase
4. Clique em **Create**
5. **Copie o Client ID e Client Secret** (você precisará deles)

### Passo 4: Configurar no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Authentication** > **Providers**
4. Encontre **Google** e clique para ativar
5. Cole:
   - **Client ID (for OAuth)**: Cole o Client ID do Google
   - **Client Secret (for OAuth)**: Cole o Client Secret do Google
6. Clique em **Save**

---

## 🔵 Configuração do Facebook OAuth

### Passo 1: Criar App no Facebook Developers

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Clique em **My Apps** > **Create App**
3. Selecione **Consumer** como tipo de app
4. Preencha:
   - **App Display Name**: Chama o Músico
   - **App Contact Email**: Seu email
5. Clique em **Create App**

### Passo 2: Adicionar Produto Facebook Login

1. No dashboard do app, encontre **Facebook Login**
2. Clique em **Set Up**
3. Selecione **Web** como plataforma
4. Configure:
   - **Site URL**: 
     ```
     http://localhost:3000
     https://seudominio.com
     ```

### Passo 3: Configurar OAuth Redirect URIs

1. No menu lateral, vá em **Facebook Login** > **Settings**
2. Em **Valid OAuth Redirect URIs**, adicione:
   ```
   https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   > **Importante**: Substitua `[SEU-PROJECT-REF]` pelo ID do seu projeto Supabase
3. Clique em **Save Changes**

### Passo 4: Obter App ID e App Secret

1. No menu lateral, vá em **Settings** > **Basic**
2. **Copie o App ID e App Secret**
3. Se o App Secret não estiver visível, clique em **Show**

### Passo 5: Configurar no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Authentication** > **Providers**
4. Encontre **Facebook** e clique para ativar
5. Cole:
   - **Client ID (for OAuth)**: Cole o App ID do Facebook
   - **Client Secret (for OAuth)**: Cole o App Secret do Facebook
6. Clique em **Save**

---

## 🔍 Encontrar o Project Reference do Supabase

Para encontrar o Project Reference necessário nas URLs de callback:

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. O **Project URL** será algo como: `https://abcdefghijklmnop.supabase.co`
5. O **Project Reference** é a parte `abcdefghijklmnop`

**Exemplo de URL de callback:**
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

---

## ✅ Verificação

### Testar Google OAuth

1. Acesse sua aplicação em `http://localhost:3000/login`
2. Clique em **Continuar com Google**
3. Você deve ser redirecionado para o Google
4. Após autorizar, deve voltar para `/dashboard`

### Testar Facebook OAuth

1. Acesse sua aplicação em `http://localhost:3000/login`
2. Clique em **Continuar com Facebook**
3. Você deve ser redirecionado para o Facebook
4. Após autorizar, deve voltar para `/dashboard`

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: A URL de callback não está configurada corretamente.

**Solução**:
- Verifique se a URL no Google/Facebook é exatamente: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- Certifique-se de usar `https://` (não `http://`)
- Não adicione barras extras ou parâmetros

### Erro: "invalid_client"

**Causa**: Client ID ou Client Secret incorretos.

**Solução**:
- Verifique se copiou corretamente no Supabase
- Certifique-se de não ter espaços extras
- No Google, use o Client ID e Secret do tipo "Web application"

### Erro: "App Not Setup"

**Causa**: App do Facebook não está em modo público ou não tem permissões configuradas.

**Solução**:
- No Facebook Developers, vá em **App Review** > **Permissions and Features**
- Certifique-se de que `email` e `public_profile` estão aprovados
- Se estiver em modo desenvolvimento, adicione usuários de teste

### OAuth funciona mas perfil não é criado

**Causa**: Erro na criação do perfil no callback.

**Solução**:
- Verifique os logs do Supabase em **Logs** > **Postgres Logs**
- Verifique se as tabelas `profiles` e `musician_profiles` existem
- Verifique se as políticas RLS permitem INSERT para usuários autenticados

---

## 📝 Notas Importantes

1. **Ambiente de Desenvolvimento**: 
   - Use `http://localhost:3000` nas configurações
   - O Supabase gerencia o callback automaticamente

2. **Ambiente de Produção**:
   - Adicione o domínio real nas configurações do Google/Facebook
   - Atualize as URLs de callback se necessário

3. **Segurança**:
   - Nunca compartilhe Client Secrets
   - Use variáveis de ambiente se necessário
   - Mantenha as credenciais seguras

4. **Limites**:
   - Google: Até 100 usuários de teste no OAuth consent screen (modo de teste)
   - Facebook: App em modo desenvolvimento tem limitações

---

## 🚀 Próximos Passos

Após configurar:

1. ✅ Teste o login com Google
2. ✅ Teste o login com Facebook
3. ✅ Verifique se o perfil é criado automaticamente
4. ✅ Teste o cadastro com código de indicação via OAuth
5. ✅ Verifique se a foto de perfil é importada do Google/Facebook

---

## 📚 Recursos Adicionais

- [Documentação Supabase OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)

