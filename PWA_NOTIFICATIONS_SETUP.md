# Configuração de Notificações Push PWA

Este documento descreve como configurar e usar o sistema de notificações push PWA para iOS e Android.

## 📋 Pré-requisitos

1. **Chaves VAPID** (Voluntary Application Server Identification)
   - Essas chaves são necessárias para autenticar o servidor que envia notificações push
   - Você precisa gerar um par de chaves (pública e privada)

## 🔑 Gerar Chaves VAPID

### Opção 1: Usando Node.js

```bash
npm install web-push -g
web-push generate-vapid-keys
```

Isso gerará:
- Public Key (para NEXT_PUBLIC_VAPID_PUBLIC_KEY)
- Private Key (para VAPID_PRIVATE_KEY - NÃO expor no cliente!)

### Opção 2: Online

Use um gerador online como: https://vapidkeys.com/

## 🔧 Configuração de Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env.local` e Vercel:

```env
# Chave pública VAPID (pode ser exposta no cliente)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNJxw... (sua chave pública)

# Chave privada VAPID (NUNCA expor no cliente - apenas server-side)
VAPID_PRIVATE_KEY=... (sua chave privada)
VAPID_SUBJECT=mailto:seu-email@exemplo.com  # Email do desenvolvedor
```

## 📦 Instalação do Banco de Dados

Execute o SQL para criar as tabelas e funções necessárias:

```sql
-- Execute o arquivo: create_push_notifications_system.sql
```

Isso criará:
- Tabela `push_subscriptions` para armazenar subscriptions dos usuários
- Funções RPC para registrar/remover subscriptions
- Funções para obter subscriptions (server-side)

## 🚀 Como Funciona

### 1. Registro de Notificações

O componente `PushNotificationManager` automaticamente:
- Registra o Service Worker
- Solicita permissão do usuário
- Cria uma PushSubscription
- Salva a subscription no banco de dados

O componente é integrado automaticamente no `DashboardLayout`.

### 2. Envio de Notificações

As notificações são enviadas através de server actions ou Edge Functions do Supabase.

**IMPORTANTE**: Para produção, você precisará criar uma Edge Function do Supabase ou usar um serviço externo que tenha acesso à chave VAPID privada. O código atual apenas prepara a estrutura.

### 3. Tipos de Notificações

O sistema suporta os seguintes tipos de notificações:

1. **Novo Convite** (`newInvite`)
2. **Convite Aceito** (`inviteAccepted`)
3. **Convite Recusado** (`inviteDeclined`)
4. **Gig Confirmada** (`gigConfirmed`)
5. **Músico Escolhido** (`musicianChosen`)
6. **Gig Cancelada** (`gigCancelled`)
7. **Nova Mensagem** (`newMessage`)
8. **Lembrete de Gig** (`gigReminder`)
9. **Convite Expirando** (`inviteExpiring`)
10. **Avaliação Pendente** (`ratingPending`)
11. **Completar Perfil** (`profileCompletion`)
12. **Lembrete Diário** (`dailyReminder`)

## 📱 Testando Notificações

### No Navegador

1. Abra o dashboard
2. O navegador solicitará permissão para notificações
3. Aceite a permissão
4. A subscription será salva automaticamente no banco

### Enviar Notificação de Teste

Você pode criar uma página de teste ou usar o console do navegador:

```javascript
// No console do navegador (apenas para teste)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.showNotification('Teste', {
      body: 'Esta é uma notificação de teste',
      icon: '/logo.png',
      badge: '/logo.png',
    });
  });
}
```

## 🔐 Segurança

- ⚠️ **NUNCA** exponha `VAPID_PRIVATE_KEY` no código do cliente
- ⚠️ Use Edge Functions do Supabase ou um serviço externo para enviar notificações
- ⚠️ As subscriptions são vinculadas ao usuário autenticado (RLS)

## 📝 Próximos Passos

Para produção, você precisará:

1. **Criar uma Edge Function do Supabase** para enviar notificações push
   - A Edge Function terá acesso à chave VAPID privada
   - Ela receberá userId e payload da notificação
   - Enviará para todas as subscriptions do usuário

2. **Integrar notificações nos eventos**:
   - Quando um convite é criado → enviar notificação
   - Quando um convite é aceito → enviar notificação
   - Quando uma gig é cancelada → enviar notificação
   - etc.

3. **Criar sistema de agendamento** para lembretes:
   - Lembrete de gig próxima (1 dia antes, 1 hora antes)
   - Lembrete diário
   - Convite expirando

## 📚 Referências

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

