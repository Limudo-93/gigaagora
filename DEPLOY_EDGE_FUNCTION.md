# Como Deploy da Edge Function para Enviar Notificações Push

## ⚠️ Problema: "Todas as tentativas de envio falharam"

Este erro acontece porque a **Edge Function do Supabase não está deployada** ou não está configurada corretamente.

## 📋 Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase**
   ```bash
   supabase login
   ```

3. **Link do projeto**
   ```bash
   supabase link --project-ref seu-project-ref
   ```

## 🚀 Deploy da Edge Function

### Passo 1: Verificar Estrutura

Certifique-se de que a estrutura está assim:
```
supabase/
  functions/
    send-push-notification/
      index.ts
```

### Passo 2: Configurar Variáveis de Ambiente no Supabase

**IMPORTANTE:** As variáveis VAPID devem estar configuradas no **Supabase Dashboard**, não apenas no `.env.local`!

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **Edge Functions** > **Secrets** (ou **Settings** > **API** > **Edge Functions**)
4. Adicione as seguintes variáveis:
   - `VAPID_PUBLIC_KEY` = sua chave pública VAPID (a mesma de `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
   - `VAPID_PRIVATE_KEY` = sua chave privada VAPID
   - `VAPID_SUBJECT` = `mailto:seu@email.com`

### Passo 3: Deploy da Function

Execute o comando:
```bash
supabase functions deploy send-push-notification
```

### Passo 4: Verificar Deploy

Após o deploy, você pode verificar:
1. No Supabase Dashboard: **Edge Functions** > **send-push-notification**
2. Testar diretamente pelo dashboard ou via código

## 🔍 Troubleshooting

### Erro: "Function not found"
- A função não foi deployada
- Verifique se o nome está correto: `send-push-notification`
- Execute `supabase functions list` para ver as funções deployadas

### Erro: "VAPID keys não configuradas"
- As variáveis de ambiente não estão configuradas no Supabase
- Verifique em **Settings** > **Edge Functions** > **Secrets**

### Erro: "Invalid VAPID key"
- As chaves VAPID estão incorretas
- Certifique-se de usar as mesmas chaves geradas
- A chave pública deve ser a mesma de `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

### Erro: "Subscription incompleta"
- O formato da subscription está incorreto
- Verifique se `endpoint`, `p256dh` e `auth` estão sendo enviados corretamente

## 📝 Verificar Logs

Para ver os logs da Edge Function:
```bash
supabase functions logs send-push-notification
```

Ou no Dashboard do Supabase: **Edge Functions** > **send-push-notification** > **Logs**

## ✅ Checklist

- [ ] Supabase CLI instalado e configurado
- [ ] Projeto linkado com `supabase link`
- [ ] Variáveis VAPID configuradas no Supabase Dashboard
- [ ] Edge Function deployada com `supabase functions deploy`
- [ ] Testando o envio de notificações

## 🔗 Referências

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deploy Edge Functions](https://supabase.com/docs/guides/functions/deploy)
- [Environment Variables](https://supabase.com/docs/guides/functions/secrets)

