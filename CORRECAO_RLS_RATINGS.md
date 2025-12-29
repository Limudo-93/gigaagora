# Correção de RLS para Tabela Ratings

## Problema

Erro ao tentar inserir avaliação:
```
new row violates row-level security policy for table "ratings"
```

## Solução

Execute o arquivo `fix_ratings_rls.sql` no Supabase SQL Editor.

### Passos:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `fix_ratings_rls.sql`
4. Execute o script completo

## O que o script faz:

1. **Habilita RLS** na tabela `ratings`
2. **Remove políticas antigas** (se existirem)
3. **Cria políticas novas**:
   - **INSERT**: Usuários podem criar avaliações onde são o avaliador
   - **SELECT**: Usuários podem ver avaliações públicas e suas próprias
   - **UPDATE**: Usuários podem atualizar suas próprias avaliações

## Políticas Criadas

### INSERT
Permite que usuários autenticados insiram avaliações onde:
- Se `rater_type = 'musician'`, então `auth.uid() = musician_id`
- Se `rater_type = 'contractor'`, então `auth.uid() = contractor_id`

### SELECT
Permite ver:
- Todas as avaliações públicas (`is_public = true`)
- Suas próprias avaliações (como avaliador ou avaliado)

### UPDATE
Permite atualizar apenas suas próprias avaliações

## Verificação

Após executar o script, você pode verificar as políticas criadas:

```sql
SELECT * FROM pg_policies WHERE tablename = 'ratings';
```

## Correções no Código

O componente `RatingDialog.tsx` foi atualizado para:
- Buscar o usuário autenticado atual (`auth.uid()`)
- Garantir que o ID do usuário autenticado seja usado corretamente
- Validar que o usuário está autenticado antes de inserir

## Teste

Após executar o script SQL:
1. Tente avaliar uma gig concluída
2. O erro de RLS não deve mais aparecer
3. A avaliação deve ser salva com sucesso

