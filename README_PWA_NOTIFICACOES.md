# Sistema de Notificações Push PWA - Chama o Músico

Sistema completo de notificações push para iOS e Android usando PWA (Progressive Web App).

## 🎯 O que foi implementado

✅ **Manifest PWA** (`public/manifest.json`)
- Configuração completa para instalação como app
- Ícones, shortcuts, tema

✅ **Service Worker** (`public/sw.js`)
- Cache de assets
- Recebimento de notificações push
- Ação ao clicar em notificações

✅ **Banco de Dados** (`create_push_notifications_system.sql`)
- Tabela `push_subscriptions`
- Funções RPC para registrar/remover subscriptions
- RLS policies configuradas

✅ **Biblioteca de Notificações** (`src/lib/push-notifications.ts`)
- Funções para registrar service worker
- Criar subscriptions
- Solicitar permissões

✅ **Gerenciador de Notificações** (`src/components/push-notifications/PushNotificationManager.tsx`)
- Componente que gerencia automaticamente o registro
- Integrado no `DashboardLayout`

✅ **Server Actions** (`src/app/actions/push-notifications.ts`)
- Função para enviar notificações
- Templates pré-configurados para todos os tipos de eventos

✅ **Edge Function** (`supabase/functions/send-push-notification/index.ts`)
- Função pronta para deploy no Supabase
- Envia notificações usando chaves VAPID

✅ **Documentação Completa**
- `PWA_NOTIFICATIONS_SETUP.md` - Guia de setup
- `INTEGRAR_NOTIFICACOES_EVENTOS.md` - Guia de integração

## 🚀 Próximos Passos

### 1. Instalar Dependências

```bash
npm install web-push --save-dev
```

### 2. Gerar Chaves VAPID

```bash
node scripts/generate-vapid-keys.js
```

Isso gerará as chaves que você precisa adicionar ao `.env.local`:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (pode ser pública)
- `VAPID_PRIVATE_KEY` (NUNCA exponha no cliente)
- `VAPID_SUBJECT=mailto:seu-email@exemplo.com`

### 3. Configurar Banco de Dados

Execute o SQL no Supabase:
```sql
-- Execute: create_push_notifications_system.sql
```

### 4. Deploy da Edge Function (Opcional)

Se quiser usar a Edge Function do Supabase:
1. Deploy da função em `supabase/functions/send-push-notification/`
2. Configure as variáveis de ambiente VAPID na função

### 5. Integrar nos Eventos

Siga o guia `INTEGRAR_NOTIFICACOES_EVENTOS.md` para adicionar notificações em:
- Novo convite
- Convite aceito/recusado
- Gig confirmada/cancelada
- Nova mensagem
- Lembretes
- Etc.

## 📱 Tipos de Notificações Implementados

1. 🎵 **Novo Convite** - Quando um músico recebe um novo convite
2. ✅ **Convite Aceito** - Quando um convite é aceito
3. ❌ **Convite Recusado** - Quando um convite é recusado
4. 🎉 **Gig Confirmada** - Quando uma gig é confirmada
5. ⭐ **Músico Escolhido** - Quando um músico é escolhido
6. ⚠️ **Gig Cancelada** - Quando uma gig é cancelada
7. 💬 **Nova Mensagem** - Quando uma nova mensagem chega
8. ⏰ **Lembrete de Gig** - Lembrete antes da gig
9. ⏱️ **Convite Expirando** - Quando um convite está prestes a expirar
10. ⭐ **Avaliação Pendente** - Quando precisa avaliar uma gig
11. 📝 **Completar Perfil** - Lembrete para completar perfil
12. 🌅 **Lembrete Diário** - Lembrete diário de novidades

## 🔐 Segurança

- ✅ RLS (Row Level Security) configurado nas tabelas
- ✅ Chaves VAPID privadas nunca expostas no cliente
- ✅ Subscriptions vinculadas ao usuário autenticado
- ✅ Edge Functions para envio seguro

## 📚 Documentação Adicional

- `PWA_NOTIFICACOES_SETUP.md` - Setup completo e configuração
- `INTEGRAR_NOTIFICACOES_EVENTOS.md` - Como integrar nos eventos

## 🐛 Troubleshooting

### Notificações não aparecem
1. Verifique se o usuário deu permissão
2. Verifique se as chaves VAPID estão configuradas
3. Verifique se a subscription foi salva no banco
4. Verifique os logs do console do navegador

### Service Worker não registra
1. Verifique se está em HTTPS (ou localhost)
2. Verifique se o arquivo `sw.js` está em `/public/`
3. Verifique os logs do console

### Edge Function falha
1. Verifique se as variáveis VAPID estão configuradas
2. Verifique os logs da Edge Function no Supabase
3. Verifique se a subscription é válida

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação oficial:
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

