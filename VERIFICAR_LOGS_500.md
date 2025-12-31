# 🔍 Como Verificar os Logs do Erro 500

## ✅ Melhorias Aplicadas

A Edge Function foi atualizada com logs **muito mais detalhados** em cada etapa:

1. ✅ Log das variáveis VAPID no início (quando a função carrega)
2. ✅ Log da requisição recebida (método, URL, headers)
3. ✅ Log do body parseado
4. ✅ Log dos dados recebidos (subscription e payload)
5. ✅ Log da validação da subscription
6. ✅ Log da configuração VAPID antes de enviar
7. ✅ Logs detalhados de erros (com stack trace completo)

## 🚀 Próximo Passo: Fazer Deploy

**IMPORTANTE:** Faça o deploy da função atualizada para ver os logs detalhados:

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

## 📊 Como Verificar os Logs

### 1. Acesse o Dashboard do Supabase

1. Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `irombysdylzmovsthekn`
3. Navegue para: **Edge Functions** > **send-push-notification**
4. Clique na aba **Logs**

### 2. Procure pelos Logs Recentes

Os logs agora incluem prefixos claros:
- `[Push Notification] Variáveis VAPID carregadas:` - Log inicial (aparece quando a função carrega)
- `[Push Notification] ========== INÍCIO DA REQUISIÇÃO ==========` - Início de cada requisição
- `[Push Notification] Body parseado com sucesso` - Confirmação do parse
- `[Push Notification] Dados recebidos:` - Validação dos dados
- `[Push Notification] Subscription validada:` - Validação da subscription
- `[Push Notification] VAPID config:` - Configuração antes de enviar
- `[Push Notification] ========== ERRO GERAL CAPTURADO ==========` - Erro capturado

### 3. Filtre os Logs

No dashboard, você pode:
- Filtrar por **Severity** (Error, Warning, Info)
- Filtrar por **Time Range** (Last hour, Last 24 hours, etc.)
- Buscar por texto específico (ex: "ERRO GERAL")

## 🔎 O Que Procurar nos Logs

### Se você ver: `Variáveis VAPID carregadas:`
- ✅ A função está carregando
- Verifique se `hasPublicKey: true` e `hasPrivateKey: true`
- Verifique se os `length` estão corretos (public ~87, private ~43)

### Se você ver: `INÍCIO DA REQUISIÇÃO`
- ✅ A requisição chegou na função
- Verifique os próximos logs para ver onde falha

### Se você ver: `Erro ao fazer parse do JSON`
- ❌ O body não é um JSON válido
- Verifique o código que chama a função (`src/app/api/notifications/send/route.ts`)

### Se você ver: `Subscription incompleta`
- ❌ A subscription não tem todos os campos
- Verifique a função `get_user_push_subscriptions` no banco

### Se você ver: `Erro ao chamar webPush.sendNotification`
- ❌ Erro ao enviar a notificação push
- Verifique o `statusCode` e `body` do erro
- Pode ser que a subscription expirou (410) ou é inválida (404)

### Se você ver: `ERRO GERAL CAPTURADO`
- ❌ Erro não tratado
- Verifique o `Error name`, `Error message` e `Error stack`

## 🎯 Checklist de Diagnóstico

Após fazer o deploy e tentar enviar uma notificação:

- [ ] Função foi deployada com sucesso? (deployment_id mudou)
- [ ] Logs aparecem no dashboard? (aba Logs)
- [ ] Qual é o primeiro log que aparece?
- [ ] Onde o erro está ocorrendo? (parse, validação, web-push, etc.)
- [ ] Qual é a mensagem de erro exata?

## 💡 Dica Importante

**Se você não ver NENHUM log:**
- A função pode estar falhando na inicialização (antes de executar qualquer código)
- Verifique se as variáveis VAPID estão configuradas nas Secrets
- Tente fazer deploy novamente
- Verifique se há erros de sintaxe no código

**Se você ver logs mas ainda receber 500:**
- Os logs mostrarão exatamente onde o erro está ocorrendo
- Copie a mensagem de erro completa dos logs
- Verifique a seção "Erros Comuns" no arquivo `FIX_500_ERROR.md`

## 📝 Próximos Passos

1. **Faça o deploy** da função atualizada
2. **Tente enviar uma notificação** novamente
3. **Acesse os logs** no dashboard
4. **Identifique o erro específico** nos logs
5. **Compartilhe os logs** se precisar de ajuda adicional

Os logs agora são muito mais detalhados e devem mostrar exatamente qual é o problema! 🎯

