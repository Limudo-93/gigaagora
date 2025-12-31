# 🔍 Troubleshooting: Edge Function sem Logs

## Problema: "Worker Logs: 0" mas "Invocations: X"

Se você vê no dashboard do Supabase que a função foi invocada várias vezes, mas não há logs, isso indica que:

1. **A função está sendo chamada** (invocações > 0)
2. **Mas não está gerando logs** (worker logs = 0)

## Possíveis Causas

### 1. Função não está sendo executada (Falha na inicialização)

A função pode estar falhando antes de executar qualquer código. Possíveis causas:

- **Módulo não encontrado**: O import `npm:web-push@^3.6.6` pode estar falhando
- **Variáveis de ambiente**: As VAPID keys podem não estar configuradas
- **Erro de sintaxe**: A função pode ter um erro de sintaxe que impede a inicialização

### 2. Logs não estão sendo coletados

Às vezes os logs levam alguns minutos para aparecer no dashboard.

## Soluções

### Passo 1: Verificar se a função foi deployada corretamente

```bash
npx supabase functions list
```

Verifique se `send-push-notification` aparece na lista.

### Passo 2: Fazer deploy novamente

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

O flag `--no-verify-jwt` é útil para testar, mas remova em produção.

### Passo 3: Verificar logs via CLI (mais confiável que o dashboard)

```bash
# Logs em tempo real
npx supabase functions logs send-push-notification --tail

# Últimas 100 linhas
npx supabase functions logs send-push-notification --limit 100
```

### Passo 4: Verificar variáveis de ambiente (Secrets)

1. Acesse **Settings** > **Edge Functions** > **Secrets**
2. Verifique se existem:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

3. **IMPORTANTE**: Se você adicionou/atualizou as secrets, pode ser necessário fazer redeploy da função:

```bash
npx supabase functions deploy send-push-notification
```

### Passo 5: Testar a função localmente (se possível)

Se você tiver o Supabase local configurado:

```bash
npx supabase functions serve send-push-notification --no-verify-jwt
```

Isso iniciará a função localmente e você verá logs no terminal.

### Passo 6: Simplificar a função temporariamente

Para testar se o problema é com o módulo `web-push`, você pode temporariamente simplificar a função:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log("[TEST] Function called");
  return new Response(
    JSON.stringify({ success: true, message: "Function is working" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
```

Se essa versão simplificada funcionar e gerar logs, então o problema está no módulo `web-push` ou na lógica da função.

### Passo 7: Verificar erros no código da API route

O erro "Edge Function returned a non-2xx status code" pode estar sendo retornado porque:

1. A função está retornando status 400/500
2. Mas não está gerando logs (falha silenciosa)

Verifique o console do servidor Next.js (onde você executa `npm run dev`) para ver se há mais detalhes do erro.

## Checklist de Diagnóstico

- [ ] Função está na lista de funções deployadas?
- [ ] Variáveis VAPID estão configuradas nas Secrets?
- [ ] Tentou fazer redeploy após configurar as Secrets?
- [ ] Tentou ver logs via CLI (`npx supabase functions logs`)?
- [ ] Verificou o console do servidor Next.js para erros?
- [ ] Testou com uma versão simplificada da função?

## Próximos Passos

Se após seguir todos os passos ainda não houver logs:

1. Verifique se há erros de build no deploy: `npx supabase functions deploy send-push-notification --debug`
2. Verifique a documentação do Supabase: https://supabase.com/docs/guides/functions/logs
3. Considere criar um issue no repositório do Supabase CLI

