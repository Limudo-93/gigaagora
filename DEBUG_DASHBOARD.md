# Debug - Dashboard sem Dados

## Problemas Identificados e Correções Aplicadas

### ✅ Correções Implementadas

1. **Melhor tratamento de erros**: Agora os componentes mostram mensagens de erro detalhadas
2. **Logs de debug**: Console.log adicionados para identificar problemas
3. **Fallback para RPCs**: Se as RPCs não existirem, tenta queries diretas
4. **Validação de userId**: Verifica se o usuário está autenticado antes de buscar dados

### 🔍 Como Diagnosticar o Problema

#### 1. Abra o Console do Navegador (F12)
   - Vá para a aba "Console"
   - Procure por mensagens de erro ou logs que começam com:
     - `GigsTabs loaded:` - mostra quantas gigs foram encontradas
     - `PendingInvites loaded:` - mostra quantos convites foram encontrados
     - `Error details:` - mostra detalhes dos erros

#### 2. Verifique os Erros Mais Comuns

**Erro: "relation does not exist"**
- **Causa**: Tabela não existe no banco de dados
- **Solução**: Verifique se as tabelas `gigs`, `invites`, `gig_roles`, `confirmations` existem no Supabase

**Erro: "permission denied" ou "new row violates row-level security"**
- **Causa**: Problemas com RLS (Row Level Security) no Supabase
- **Solução**: Verifique as políticas RLS nas tabelas

**Erro: "function does not exist" (código 42883)**
- **Causa**: RPC não existe no banco
- **Solução**: O código agora tenta uma query direta como fallback

**Nenhum erro, mas também nenhum dado**
- **Causa**: Não há dados no banco ou filtros muito restritivos
- **Solução**: Verifique se existem dados nas tabelas

#### 3. Verifique o Banco de Dados

Execute estas queries no Supabase SQL Editor:

```sql
-- Verificar se existem gigs para o usuário
SELECT COUNT(*) FROM gigs WHERE contractor_id = 'SEU_USER_ID_AQUI';

-- Verificar se existem convites pendentes
SELECT COUNT(*) FROM invites 
WHERE musician_id = 'SEU_USER_ID_AQUI' 
AND status IN ('pending', 'sent');

-- Verificar estrutura da tabela invites
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invites';

-- Verificar estrutura da tabela gigs
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gigs';
```

#### 4. Verifique as RPCs

```sql
-- Verificar se a RPC existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'rpc_%';
```

Se as RPCs não existirem, o código tentará usar queries diretas como fallback.

### 📋 Checklist de Verificação

- [ ] Console do navegador aberto (F12)
- [ ] Verificar mensagens de erro no console
- [ ] Verificar se o userId está sendo passado corretamente
- [ ] Verificar se as tabelas existem no Supabase
- [ ] Verificar se há dados nas tabelas
- [ ] Verificar políticas RLS no Supabase
- [ ] Verificar se as RPCs existem (se não, o fallback será usado)

### 🛠️ Próximos Passos

1. **Se não houver dados**: Crie alguns dados de teste no banco
2. **Se houver erros de permissão**: Ajuste as políticas RLS
3. **Se as tabelas não existirem**: Crie as tabelas necessárias
4. **Se as RPCs não existirem**: O código usará queries diretas automaticamente

### 💡 Dicas

- Os logs no console mostram quantos registros foram encontrados
- As mensagens de erro agora incluem mais detalhes (código, hint, etc.)
- O código tenta automaticamente usar queries diretas se as RPCs falharem

