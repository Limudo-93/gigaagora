# Análise dos Logs de Debug

## 🔍 Problemas Identificados nos Logs

### ✅ H1/H8: CONFIRMADO - Query de avaliações incorreta

**Evidência (linha 3, 16, 21, etc.)**:
```json
{"ratings":[{
  "invite_id":"21e071f1-7a30-43bd-91e3-2b26c1ca8c44",
  "rater_type":"musician",
  "musician_id":"320557ea-2ce8-4c43-ad97-f1c29cc28e94",
  "contractor_id":"320557ea-2ce8-4c43-ad97-f1c29cc28e94"  // ⚠️ MESMO USUÁRIO!
}]}
```

**Problema**: A query está retornando avaliações onde o usuário está em AMBOS os campos (musician_id E contractor_id), indicando que ele está se avaliando. Isso é um bug grave.

**Evidência adicional (linha 51)**:
```json
{"ratings":[{
  "invite_id":"d1283308-fdc4-4c38-a38e-a499f6a04069",
  "rater_type":"contractor",  // Contratante está avaliando
  "musician_id":"ae1ff540-fa77-45ad-b388-07753b6f243b",  // Mas o músico é o usuário atual
  "contractor_id":"320557ea-2ce8-4c43-ad97-f1c29cc28e94"
}]}
```

**Problema**: A query está retornando avaliações onde o usuário é o AVALIADO, não o AVALIADOR. Isso faz com que o botão de avaliação não apareça quando deveria.

### ✅ H3/H5: CONFIRMADO - Erro na função rpc_create_cancellation_notification

**Evidência (linhas 149, 158, 167, 176)**:
```json
{
  "notifError":"there is no unique or exclusion constraint matching the ON CONFLICT specification",
  "notifErrorCode":"42P10"
}
```

**Problema**: A função SQL está tentando usar `ON CONFLICT` mas não há constraint única correspondente na tabela `cancellation_notifications`.

### ✅ H2: REJEITADO - Importação dinâmica funciona

**Evidência (linhas 142, 151, 160, 170)**:
```json
{"hasStartConversation":true,"hasSendMessage":true}
```

A importação dinâmica está funcionando corretamente.

### ⚠️ H4: INCONCLUSIVO - useEffect sendo chamado múltiplas vezes

O useEffect está sendo chamado várias vezes, mas isso pode ser normal durante desenvolvimento/hot reload.

## 🎯 Correções Necessárias

1. **Corrigir query de avaliações** - Filtrar apenas onde o usuário é o AVALIADOR
2. **Corrigir função rpc_create_cancellation_notification** - Remover ON CONFLICT ou criar constraint única
3. **Verificar dados no banco** - Pode haver avaliações incorretas onde usuário se avalia

