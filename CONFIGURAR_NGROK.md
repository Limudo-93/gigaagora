# 🔧 Configurar Supabase para ngrok

Quando você usa ngrok para testar a aplicação fora da sua rede local, é necessário configurar o Supabase para aceitar o domínio ngrok.

## 📋 Passos para Configuração

### 1. Obter a URL do ngrok

Sua URL do ngrok é: `https://civilizational-fadedly-elvira.ngrok-free.dev/`

### 2. Configurar no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Authentication** > **URL Configuration**
4. Em **Site URL**, adicione:
   ```
   https://civilizational-fadedly-elvira.ngrok-free.dev
   ```
5. Em **Redirect URLs**, adicione:
   ```
   https://civilizational-fadedly-elvira.ngrok-free.dev/auth/callback
   https://civilizational-fadedly-elvira.ngrok-free.dev/dashboard
   ```
6. Clique em **Save**

### 3. Configurar no Google Cloud Console (se usar Google OAuth)

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services** > **Credentials**
3. Encontre seu OAuth 2.0 Client ID
4. Clique para editar
5. Em **Authorized JavaScript origins**, adicione:
   ```
   https://civilizational-fadedly-elvira.ngrok-free.dev
   ```
6. Clique em **Save**

### 4. Configurar no Facebook Developers (se usar Facebook OAuth)

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Selecione seu app
3. Vá em **Facebook Login** > **Settings**
4. Em **Valid OAuth Redirect URIs**, adicione:
   ```
   https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   > **Nota**: A URL de callback do OAuth continua sendo a do Supabase, não a do ngrok. O ngrok só precisa estar nas configurações do Supabase.

### 5. Reiniciar a aplicação

Após fazer as alterações no Supabase, reinicie sua aplicação Next.js para que as mudanças tenham efeito.

## ⚠️ Importante

- **URL do ngrok muda**: Se você reiniciar o ngrok, a URL mudará. Você precisará atualizar as configurações no Supabase e no Google Cloud Console com a nova URL.

- **URL de callback do OAuth**: A URL de callback do OAuth (Google/Facebook) continua sendo a do Supabase (`https://[PROJECT-REF].supabase.co/auth/v1/callback`), não a do ngrok. O ngrok só precisa estar configurado no Supabase como Site URL e Redirect URLs.

- **Desenvolvimento local**: Para desenvolvimento local, mantenha também `http://localhost:3000` nas configurações do Supabase.

## 🔍 Verificação

Após configurar:

1. Acesse sua aplicação via ngrok: `https://civilizational-fadedly-elvira.ngrok-free.dev/login`
2. Tente fazer login com Google
3. Você deve ser redirecionado de volta para o ngrok, não para localhost

## 🐛 Problemas Comuns

### Ainda redireciona para localhost

- Verifique se adicionou a URL do ngrok no Supabase Dashboard em **Authentication** > **URL Configuration**
- Certifique-se de ter reiniciado a aplicação após as alterações
- Limpe o cache do navegador

### Erro "redirect_uri_mismatch" no Google

- Verifique se adicionou a URL do ngrok em **Authorized JavaScript origins** no Google Cloud Console
- Certifique-se de usar `https://` (não `http://`)
- Não adicione barra no final (`/`)

