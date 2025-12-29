# Configuração de RLS (Row Level Security)

## Problema

Se você está recebendo o erro:
```
Erro ao criar gig: new row violates row-level security policy for table "gigs"
```

Isso significa que as políticas RLS (Row Level Security) não estão configuradas no Supabase.

## Solução

### Passo 1: Acesse o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Execute as Políticas RLS

1. Abra o arquivo `rls_policies.sql` neste projeto
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verifique se Funcionou

Após executar o script, você deve ver uma mensagem de sucesso. As políticas criadas permitem:

- ✅ Usuários autenticados podem criar gigs onde são o contractor
- ✅ Usuários podem ver suas próprias gigs
- ✅ Usuários podem atualizar suas próprias gigs
- ✅ Usuários podem deletar suas próprias gigs
- ✅ Usuários podem gerenciar as vagas (roles) de suas próprias gigs

### Verificação

Para verificar se as políticas foram criadas:

1. No Supabase Dashboard, vá em **Authentication** > **Policies**
2. Ou execute no SQL Editor:
```sql
SELECT * FROM pg_policies WHERE tablename = 'gigs';
SELECT * FROM pg_policies WHERE tablename = 'gig_roles';
```

### Nota Importante

Se você já tiver políticas existentes que conflitam, você pode precisar removê-las primeiro:

```sql
-- Listar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'gigs';

-- Remover uma política específica (substitua 'nome_da_politica' pelo nome real)
DROP POLICY IF EXISTS "nome_da_politica" ON gigs;
```

Depois, execute novamente o script `rls_policies.sql`.

