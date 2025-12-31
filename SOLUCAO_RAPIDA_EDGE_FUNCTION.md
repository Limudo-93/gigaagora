# ⚡ Solução Rápida: Edge Function Retornando Erro

## Problema: "Edge Function returned a non-2xx status code"

Se você está vendo este erro repetidamente, siga estes passos **na ordem**:

## 🔍 Diagnóstico Rápido

### 1. Verificar se a função está deployada

```bash
npx supabase functions list
```

Se `send-push-notification` **não** aparecer na lista, você precisa fazer deploy:

```bash
npx supabase functions deploy send-push-notification
```

### 2. Verificar Secrets (VAPID Keys) - MAIS COMUM

**Essa é a causa mais comum do erro!**

1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_REF]/settings/functions
2. Vá em **Secrets**
3. Verifique se existem estas 3 variáveis:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

**Se NÃO existirem:**
- Você precisa gerar as chaves VAPID primeiro
- Execute: `node scripts/generate-vapid-keys.js`
- Copie as chaves geradas
- Adicione-as nas Secrets do Supabase
- **IMPORTANTE**: Após adicionar as Secrets, faça redeploy:
  ```bash
  npx supabase functions deploy send-push-notification
  ```

### 3. Verificar logs (para ver o erro real)

**No Dashboard do Supabase (Recomendado):**
1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_REF]/functions
2. Clique em `send-push-notification`
3. Na página da função, você verá métricas e logs
4. Se não houver logs (Worker Logs: 0), significa que a função está falhando na inicialização

**Alternativa - Verificar console do servidor Next.js:**
- O código agora tem logs detalhados
- Verifique o terminal onde você executa `npm run dev`
- Procure por mensagens como `[Send Notification] Error...`

## ✅ Checklist de Solução

Execute estes comandos na ordem:

```bash
# 1. Verificar se está linkado
npx supabase link --project-ref [SEU_PROJECT_REF]

# 2. Fazer deploy da função
npx supabase functions deploy send-push-notification

# 3. Verificar logs (deixe rodando)
npx supabase functions logs send-push-notification --tail
```

**Enquanto os logs estão rodando, tente enviar uma notificação.** Você verá o erro real no terminal.

## 🎯 Causas Mais Comuns

1. **VAPID Keys não configuradas** (90% dos casos)
   - ✅ Solução: Configure as Secrets no Supabase Dashboard

2. **Função não deployada**
   - ✅ Solução: Execute `npx supabase functions deploy send-push-notification`

3. **VAPID Keys incorretas**
   - ✅ Solução: Gere novas chaves e atualize as Secrets

4. **Module npm:web-push não funcionando**
   - ✅ Solução: Verifique os logs para ver se há erro de importação

## 📝 Próximos Passos

Após verificar os logs e identificar o erro específico:

- Se for "VAPID keys não configuradas": Configure as Secrets
- Se for erro de módulo: Verifique se `npm:web-push@^3.6.6` está disponível
- Se for outro erro: Compartilhe a mensagem de erro completa dos logs

