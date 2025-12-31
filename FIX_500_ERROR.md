# 🔧 Como Resolver Erro 500 na Edge Function

## Problema: Status Code 500 em todas as invocações

Se você está vendo **500 (Internal Server Error)** nas invocações da Edge Function, isso significa que há um erro durante a execução da função.

## ✅ Melhorias Aplicadas

A Edge Function foi atualizada com:

1. **Logs mais detalhados** em cada etapa da execução
2. **Tratamento de erros melhorado** para identificar a causa exata
3. **Validação mais robusta** dos dados recebidos
4. **Mensagens de erro mais informativas**

## 🚀 Deploy da Função Atualizada

Para aplicar as melhorias, faça o deploy da função atualizada:

```bash
npx supabase functions deploy send-push-notification --no-verify-jwt
```

**Nota:** Se você já fez login e link do projeto anteriormente, pode pular esses passos.

## 🔍 Como Diagnosticar o Erro 500

### 1. Verificar Logs da Edge Function

Após fazer o deploy, os logs agora são muito mais detalhados:

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Edge Functions** > **send-push-notification**
4. Clique na aba **Logs**
5. Procure por logs recentes (últimos minutos)

Os logs agora incluem:
- `[Push Notification] Requisição recebida:` - Informações da requisição
- `[Push Notification] Body recebido:` - Primeiros 200 caracteres do body
- `[Push Notification] Dados recebidos:` - Validação dos dados
- `[Push Notification] VAPID config:` - Status das chaves VAPID
- `[Push Notification] Subscription validada:` - Validação da subscription
- `[Push Notification] Erro ao chamar webPush.sendNotification:` - Erros específicos do web-push

### 2. Verificar Variáveis de Ambiente (Secrets)

Certifique-se de que as seguintes variáveis estão configuradas:

1. Acesse **Settings** > **Edge Functions** > **Secrets**
2. Verifique se existem:
   - `VAPID_PUBLIC_KEY` (deve ter ~87 caracteres)
   - `VAPID_PRIVATE_KEY` (deve ter ~43 caracteres)
   - `VAPID_SUBJECT` (ex: `mailto:admin@chamaomusico.com`)

**Importante:** As chaves VAPID devem ser válidas e no formato correto.

### 3. Erros Comuns e Soluções

#### Erro: "VAPID keys não configuradas"
- **Causa:** As variáveis VAPID não estão configuradas nas Secrets
- **Solução:** Configure as variáveis no Supabase Dashboard (Settings > Edge Functions > Secrets)
- **Verificação:** Os logs mostrarão `VAPID_PUBLIC_KEY length: 0` ou `VAPID_PRIVATE_KEY length: 0`

#### Erro: "Invalid JSON in request body"
- **Causa:** O body da requisição não é um JSON válido
- **Solução:** Verifique o código que chama a Edge Function (`src/app/api/notifications/send/route.ts`)
- **Verificação:** Os logs mostrarão o erro de parse do JSON

#### Erro: "Subscription incompleta"
- **Causa:** A subscription não tem todos os campos necessários (endpoint, p256dh, auth)
- **Solução:** Verifique se o registro da subscription está funcionando corretamente
- **Verificação:** Os logs mostrarão quais campos estão faltando

#### Erro do web-push (statusCode 410, 404, etc.)
- **Causa:** A subscription expirou ou é inválida
- **Solução:** 
  - O usuário precisa registrar uma nova subscription
  - Verifique se as chaves VAPID estão corretas
- **Verificação:** Os logs mostrarão `Erro statusCode:` com o código específico

#### Erro: "Erro ao serializar payload"
- **Causa:** O payload contém dados que não podem ser serializados em JSON
- **Solução:** Verifique o formato do payload enviado
- **Verificação:** Os logs mostrarão o erro de serialização

### 4. Verificar a Aba "Invocations"

Na aba **Invocations** do Dashboard:

1. Clique em uma invocação com erro 500
2. Veja a aba **Details** ou **Raw**
3. Procure pela mensagem de erro no campo `event_message` ou `metadata`

Agora as mensagens de erro são mais detalhadas e incluem:
- Tipo do erro
- Mensagem específica
- Status code (se aplicável)
- Body do erro (se disponível)

## 📋 Checklist de Diagnóstico

Após fazer o deploy e tentar enviar uma notificação:

- [ ] Edge Function foi deployada com sucesso?
- [ ] Variáveis VAPID estão configuradas nas Secrets do Supabase?
- [ ] Os logs da Edge Function mostram algum erro específico?
- [ ] Qual é a mensagem de erro exata nos logs?
- [ ] A subscription do usuário está ativa no banco de dados?
- [ ] O formato da subscription está correto (endpoint, p256dh, auth)?

## 🎯 Próximos Passos

1. **Faça o deploy** da função atualizada
2. **Tente enviar uma notificação** novamente
3. **Verifique os logs** no Supabase Dashboard
4. **Identifique o erro específico** nos logs
5. **Aplique a solução** baseada no erro encontrado

## 💡 Dica

Se os logs ainda não aparecerem, verifique:
- Se a função foi deployada corretamente
- Se você está olhando os logs do projeto correto
- Se o filtro de tempo está configurado para mostrar logs recentes

Os logs agora são muito mais detalhados e devem ajudar a identificar exatamente qual é o problema!

