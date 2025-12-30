# Guia de Integração de Notificações Push nos Eventos

Este documento descreve como integrar as notificações push em todos os eventos relevantes da aplicação.

## 📋 Eventos que Precisam de Notificações

### 1. ✅ Novo Convite Recebido (`newInvite`)

**Onde**: Quando um convite é criado para um músico

**Arquivo**: `create_rpc_accept_invite.sql` ou função RPC que cria convites

**Implementação**:
```typescript
// Após criar o convite, enviar notificação
import { sendPushNotification, NotificationTemplates } from '@/app/actions/push-notifications';

await sendPushNotification(
  musicianId,
  NotificationTemplates.newInvite(gigTitle, contractorName)
);
```

### 2. ✅ Convite Aceito (`inviteAccepted`)

**Onde**: Quando um músico aceita um convite

**Arquivo**: `src/components/dashboard/PendingInvites.tsx` - função `handleAccept`

**Implementação**:
```typescript
// Após aceitar o convite com sucesso
if (result.success) {
  // Enviar notificação para o contratante
  await sendPushNotification(
    contractorId,
    NotificationTemplates.inviteAccepted(gigTitle, musicianName)
  );
}
```

### 3. ✅ Convite Recusado (`inviteDeclined`)

**Onde**: Quando um músico recusa um convite

**Arquivo**: `src/components/dashboard/PendingInvites.tsx` - função `handleDecline`

**Implementação**:
```typescript
// Após recusar o convite com sucesso
if (result.success) {
  // Enviar notificação para o contratante
  await sendPushNotification(
    contractorId,
    NotificationTemplates.inviteDeclined(gigTitle, musicianName)
  );
}
```

### 4. ✅ Gig Confirmada (`gigConfirmed`)

**Onde**: Quando um músico é confirmado para uma gig

**Arquivo**: `src/components/dashboard/UpcomingConfirmedGigs.tsx` ou função de confirmação

**Implementação**:
```typescript
// Após confirmar a gig
if (confirmationSuccess) {
  await sendPushNotification(
    musicianId,
    NotificationTemplates.gigConfirmed(gigTitle)
  );
}
```

### 5. ✅ Músico Escolhido (`musicianChosen`)

**Onde**: Quando um contratante escolhe um músico específico (após vários aceites)

**Arquivo**: Página de matches da gig ou função de seleção

**Implementação**:
```typescript
// Quando o contratante escolhe um músico
await sendPushNotification(
  selectedMusicianId,
  NotificationTemplates.musicianChosen(gigTitle, contractorName)
);
```

### 6. ✅ Gig Cancelada (`gigCancelled`)

**Onde**: Quando uma gig é cancelada

**Arquivo**: Função que cancela gigs

**Implementação**:
```typescript
// Ao cancelar uma gig, notificar todos os músicos confirmados
const confirmedMusicians = await getConfirmedMusiciansForGig(gigId);
for (const musician of confirmedMusicians) {
  await sendPushNotification(
    musician.id,
    NotificationTemplates.gigCancelled(gigTitle, cancellationReason)
  );
}
```

### 7. ✅ Nova Mensagem (`newMessage`)

**Onde**: Quando uma nova mensagem é enviada

**Arquivo**: `src/app/dashboard/messages/page.tsx` - função de envio de mensagem

**Implementação**:
```typescript
// Após enviar mensagem com sucesso
if (messageSent) {
  await sendPushNotification(
    receiverId,
    NotificationTemplates.newMessage(
      senderName,
      messagePreview,
      conversationId
    )
  );
}
```

### 8. ⏰ Lembrete de Gig (`gigReminder`)

**Onde**: Sistema de agendamento (cron job ou Edge Function agendada)

**Implementação**:
```typescript
// Criar uma Edge Function do Supabase que roda diariamente
// Verificar gigs que estão próximas (1 dia antes, 1 hora antes)
const upcomingGigs = await getGigsStartingSoon();

for (const gig of upcomingGigs) {
  const confirmedMusicians = await getConfirmedMusiciansForGig(gig.id);
  for (const musician of confirmedMusicians) {
    await sendPushNotification(
      musician.id,
      NotificationTemplates.gigReminder(
        gig.title,
        formatTimeUntil(gig.start_time)
      )
    );
  }
}
```

### 9. ⏱️ Convite Expirando (`inviteExpiring`)

**Onde**: Sistema de agendamento (cron job ou Edge Function agendada)

**Implementação**:
```typescript
// Verificar convites que estão prestes a expirar (últimas 6-12 horas)
const expiringInvites = await getExpiringInvites();

for (const invite of expiringInvites) {
  const hoursLeft = calculateHoursUntilExpiration(invite.expires_at);
  await sendPushNotification(
    invite.musician_id,
    NotificationTemplates.inviteExpiring(gigTitle, hoursLeft)
  );
}
```

### 10. ⭐ Avaliação Pendente (`ratingPending`)

**Onde**: Após uma gig ser concluída

**Implementação**:
```typescript
// Após marcar gig como concluída
if (gigCompleted) {
  // Notificar músico e contratante para avaliarem
  await sendPushNotification(
    musicianId,
    NotificationTemplates.ratingPending(gigTitle)
  );
  await sendPushNotification(
    contractorId,
    NotificationTemplates.ratingPending(gigTitle)
  );
}
```

### 11. 📝 Completar Perfil (`profileCompletion`)

**Onde**: Quando o perfil está incompleto (sistema de agendamento)

**Implementação**:
```typescript
// Verificar perfis incompletos periodicamente
const incompleteProfiles = await getIncompleteProfiles();

for (const profile of incompleteProfiles) {
  const completionPercent = calculateCompletionPercent(profile);
  if (completionPercent < 80) {
    await sendPushNotification(
      profile.user_id,
      NotificationTemplates.profileCompletion(completionPercent)
    );
  }
}
```

### 12. 🌅 Lembrete Diário (`dailyReminder`)

**Onde**: Sistema de agendamento (Edge Function agendada diariamente)

**Implementação**:
```typescript
// Enviar lembretes diários para usuários ativos
const activeUsers = await getActiveUsers();

for (const user of activeUsers) {
  const pendingInvites = await countPendingInvites(user.id);
  const upcomingGigs = await countUpcomingGigs(user.id);
  
  if (pendingInvites > 0 || upcomingGigs > 0) {
    await sendPushNotification(
      user.id,
      NotificationTemplates.dailyReminder(pendingInvites, upcomingGigs)
    );
  }
}
```

## 🔧 Como Implementar

### Passo 1: Instalar Dependências

```bash
npm install web-push
npm install --save-dev @types/web-push
```

### Passo 2: Gerar Chaves VAPID

Execute o script:
```bash
node scripts/generate-vapid-keys.js
```

Adicione as chaves ao `.env.local` e Vercel.

### Passo 3: Deploy da Edge Function

1. Deploy da Edge Function `send-push-notification` no Supabase
2. Configure as variáveis de ambiente VAPID na Edge Function

### Passo 4: Atualizar sendPushNotification

Atualize `src/app/actions/push-notifications.ts` para chamar a Edge Function:

```typescript
export async function sendPushNotification(
  userId: string,
  notification: NotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Buscar subscriptions
    const { data: subscriptions, error } = await supabase.rpc(
      "get_user_push_subscriptions",
      { p_user_id: userId }
    );

    if (error || !subscriptions || subscriptions.length === 0) {
      return { success: false, error: "No subscriptions found" };
    }

    // Enviar para cada subscription via Edge Function
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const { error: functionError } = await supabase.functions.invoke(
          "send-push-notification",
          {
            body: {
              subscription: {
                endpoint: sub.endpoint,
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
              payload: notification,
            },
          }
        );

        if (functionError) throw functionError;
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    return { success: failed.length === 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### Passo 5: Integrar nos Eventos

Adicione as chamadas `sendPushNotification` nos locais indicados acima.

## 📝 Notas Importantes

1. **Performance**: As notificações são enviadas de forma assíncrona, não bloqueiam a operação principal
2. **Falhas**: Se uma notificação falhar, a operação principal não deve ser afetada
3. **Rate Limiting**: Considere implementar rate limiting para evitar spam de notificações
4. **Agendamento**: Use Supabase Edge Functions com cron jobs ou serviços externos para lembretes

## 🚀 Testando

1. Abra o dashboard e aceite as notificações
2. Execute uma ação que deveria disparar uma notificação
3. Verifique se a notificação aparece no dispositivo

## 📚 Próximos Passos

- [ ] Implementar todas as integrações listadas acima
- [ ] Criar Edge Functions para agendamento de lembretes
- [ ] Adicionar logs e monitoramento de notificações
- [ ] Implementar preferências de notificação por usuário
- [ ] Adicionar analytics de notificações (taxa de abertura, etc.)

