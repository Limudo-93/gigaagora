# Análise Completa de Debug - GigaAgora

## 🎯 Hipóteses de Bugs Identificadas

### H1: Problema na verificação de avaliações existentes
**Localização**: `UpcomingConfirmedGigs.tsx:219-236`
**Problema**: A função `checkExistingRatings` usa `.or()` que pode não funcionar corretamente e não filtra por `rater_type`, causando falsos positivos
**Impacto**: Botões de avaliação podem não aparecer quando deveriam, ou aparecer quando não deveriam

### H2: Importação dinâmica pode falhar silenciosamente
**Localização**: `UpcomingConfirmedGigs.tsx:320`
**Problema**: `await import("@/lib/messages")` pode falhar e o erro é apenas logado, não tratado adequadamente
**Impacto**: Mensagens de cancelamento podem não ser enviadas sem o usuário saber

### H3: RPC functions podem não existir no banco
**Localização**: Múltiplos arquivos
**Problema**: Funções RPC como `rpc_create_cancellation_notification`, `get_or_create_conversation` podem não estar criadas
**Impacto**: Funcionalidades quebram silenciosamente

### H4: Dependências faltando em useEffect
**Localização**: `UpcomingConfirmedGigs.tsx:209-217`
**Problema**: `checkExistingRatings` é chamado mas não está nas dependências do useEffect
**Impacto**: Avaliações podem não ser verificadas corretamente após mudanças

### H5: RLS pode bloquear funções SECURITY DEFINER
**Localização**: `create_cancellation_notifications.sql:110`
**Problema**: Função usa SECURITY DEFINER mas políticas RLS podem ainda bloquear
**Impacto**: Notificações podem não ser criadas

### H6: Validação de dados faltando
**Localização**: Múltiplos componentes
**Problema**: Componentes não validam se dados existem antes de acessar propriedades
**Impacto**: Erros de runtime quando dados são null/undefined

### H7: Problema de sincronização de estado
**Localização**: `PendingInvites.tsx`, `UpcomingConfirmedGigs.tsx`
**Problema**: Estado pode ficar inconsistente após operações assíncronas
**Impacto**: UI mostra dados incorretos

### H8: Query de avaliações incorreta
**Localização**: `UpcomingConfirmedGigs.tsx:224-228`
**Problema**: Query não filtra por `rater_type`, pode pegar avaliações erradas
**Impacto**: Botões de avaliação aparecem/desaparecem incorretamente

## 🔧 Instrumentação Necessária

Vou adicionar logs em pontos críticos para testar todas as hipóteses.

