# 🚀 Resumo Rápido - Configuração OAuth

## ⚡ Configuração Rápida

### Google OAuth

1. **Google Cloud Console**:
   - Criar projeto
   - OAuth consent screen → External
   - Credentials → OAuth Client ID → Web application
   - **Authorized redirect URI**: `https://[PROJECT-REF].supabase.co/auth/v1/callback`

2. **Supabase Dashboard**:
   - Authentication → Providers → Google
   - Ativar e colar Client ID e Client Secret

### Facebook OAuth

1. **Facebook Developers**:
   - Criar app → Consumer
   - Adicionar produto "Facebook Login"
   - Settings → Valid OAuth Redirect URIs: `https://[PROJECT-REF].supabase.co/auth/v1/callback`

2. **Supabase Dashboard**:
   - Authentication → Providers → Facebook
   - Ativar e colar App ID e App Secret

## 🔑 Onde encontrar o Project Reference

Supabase Dashboard → Settings → API → Project URL
- Exemplo: `https://abcdefghijklmnop.supabase.co`
- Project Reference: `abcdefghijklmnop`

## ✅ URL de Callback (use em ambos)

```
https://[PROJECT-REF].supabase.co/auth/v1/callback
```

Substitua `[PROJECT-REF]` pelo ID do seu projeto Supabase.

## 📝 Checklist

- [ ] Google OAuth configurado no Google Cloud Console
- [ ] Google OAuth ativado no Supabase
- [ ] Facebook OAuth configurado no Facebook Developers
- [ ] Facebook OAuth ativado no Supabase
- [ ] URLs de callback configuradas corretamente
- [ ] Testado login com Google
- [ ] Testado login com Facebook
- [ ] Perfil criado automaticamente após OAuth

## 🐛 Problemas Comuns

**redirect_uri_mismatch**: Verifique se a URL está exatamente igual em ambos os lugares

**invalid_client**: Verifique se copiou corretamente Client ID e Secret

**App Not Setup (Facebook)**: Adicione `email` e `public_profile` nas permissões

