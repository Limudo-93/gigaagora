# 🔐 Como Resolver Erro 401 (Unauthorized) na Edge Function

## Problema: Status Code 401 em todas as invocações

Se você está vendo **401 (Unauthorized)** em todas as invocações da Edge Function, isso significa que a função está rejeitando a requisição por falta de autenticação.

## 🔍 Diagnóstico

No Dashboard do Supabase, na aba **Invocations**, você verá:
- Todas as invocações com status **401**
- Método: **POST**

## ✅ Solução

### Opção 1: Permitir chamadas sem autenticação (Recomendado para notificações)

Como a chamada já vem do servidor Next.js (que já autenticou o usuário), você pode fazer a Edge Function aceitar chamadas sem verificar o token JWT.

**No arquivo `supabase/functions/send-push-notification/index.ts`:**

A função já está configurada para aceitar chamadas sem autenticação obrigatória. Se você ainda está recebendo 401, verifique:

1. **A função foi deployada com a flag `--no-verify-jwt`?**

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

⚠️ **IMPORTANTE**: Esta flag permite que a função seja chamada sem autenticação. Use com cuidado em produção.

### Opção 2: Configurar autenticação correta (Recomendado para produção)

Se você quer manter autenticação, precisa garantir que o token está sendo passado:

1. **No código da API route** (`src/app/api/notifications/send/route.ts`):
   - O `createClient()` do servidor já deveria incluir o token automaticamente
   - Verifique se o usuário está autenticado antes de chamar a função

2. **Deploy da função SEM a flag `--no-verify-jwt`**:
```bash
npx supabase functions deploy send-push-notification
```

3. **No código da Edge Function**, você pode verificar o token:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: { Authorization: req.headers.get('Authorization')! },
  },
})

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
```

## 🚀 Solução Rápida (Para Testes)

Para testar rapidamente, faça deploy com `--no-verify-jwt`:

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

Depois, tente enviar uma notificação novamente.

## ⚠️ Segurança em Produção

- Se você usar `--no-verify-jwt`, a função pode ser chamada por qualquer pessoa que conheça a URL
- Para produção, recomendamos:
  1. Verificar autenticação dentro da função (Opção 2)
  2. Ou usar um header customizado/API key
  3. Ou verificar o token manualmente na função

## 📝 Próximos Passos

1. Faça deploy com `--no-verify-jwt` para testar
2. Verifique se o 401 desaparece
3. Se funcionar, implemente autenticação adequada para produção

