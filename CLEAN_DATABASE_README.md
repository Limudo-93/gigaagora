# Scripts para Limpar o Banco de Dados

Este diretório contém scripts SQL para limpar todos os dados do banco de dados, mantendo apenas a estrutura das tabelas. Use apenas em ambiente de desenvolvimento/testes.

## 📋 Scripts Disponíveis

### 1. `clean_database.sql` (Recomendado)
- **O que faz**: Remove todos os dados das tabelas, mas **mantém os usuários** em `auth.users`
- **Quando usar**: Quando você quer limpar os dados mas manter os usuários cadastrados
- **Seguro**: Não deleta usuários, apenas dados relacionados

### 2. `clean_database_complete.sql` (Completo)
- **O que faz**: Remove todos os dados das tabelas
- **Opcional**: Pode deletar usuários também (linha comentada)
- **Quando usar**: Quando você quer começar completamente do zero
- **⚠️ Cuidado**: Se descomentar a linha de deletar usuários, todos serão removidos

## 🚀 Como Usar

### Passo 1: Acesse o SQL Editor do Supabase
1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral

### Passo 2: Execute o Script
1. Copie o conteúdo do script escolhido (`clean_database.sql` ou `clean_database_complete.sql`)
2. Cole no SQL Editor
3. Clique em **Run** ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

### Passo 3: Verifique os Resultados
O script mostrará mensagens de progresso e uma verificação final indicando quantos registros restam em cada tabela.

## 📊 Tabelas que Serão Limpadas

O script remove dados das seguintes tabelas (nesta ordem):

1. **Mensagens e Comunicação**
   - `messages`
   - `conversations`

2. **Gigs e Convites**
   - `confirmations`
   - `ratings`
   - `invites`
   - `gig_roles`
   - `gigs`

3. **Relacionamentos**
   - `favorites`
   - `band_musician_history`
   - `reliability_events`
   - `blocks`
   - `active_blocks`
   - `responsibility_terms`

4. **Perfis**
   - `musician_directory`
   - `musician_profiles`
   - `contractor_profiles`
   - `profiles`
   - `user_preferences`

## ⚠️ Importante

- **Backup**: Se você tiver dados importantes, faça backup antes de executar
- **Ambiente**: Use apenas em desenvolvimento/testes, nunca em produção
- **Usuários**: O script `clean_database.sql` **NÃO** deleta usuários. Se quiser deletar também, use `clean_database_complete.sql` e descomente a linha `DELETE FROM auth.users;`
- **Storage**: Arquivos no Supabase Storage (fotos de perfil, flyers) **NÃO** são deletados automaticamente. Você precisa deletá-los manualmente pela interface do Supabase

## 🔄 Após Limpar o Banco

1. **Criar novos usuários** através do sistema de autenticação
2. **Completar perfis** (músico ou contratante)
3. **Criar novas gigs** para testar
4. **Testar o fluxo completo** de convites e confirmações

## 🐛 Problemas Comuns

### Erro: "relation does not exist"
- Algumas tabelas podem não existir no seu banco. Isso é normal, o script tentará deletar apenas as que existem.

### Erro: "violates foreign key constraint"
- O script já deleta na ordem correta, mas se ainda houver erro, verifique se há triggers ou constraints adicionais.

### Usuários ainda aparecem
- O script `clean_database.sql` mantém os usuários. Use `clean_database_complete.sql` e descomente a linha de deletar usuários se necessário.

## 📝 Notas Técnicas

- O script usa transações (`BEGIN`/`COMMIT`) para garantir atomicidade
- Todas as operações são seguras e podem ser revertidas (exceto se você deletar usuários)
- O script verifica automaticamente quantos registros restam após a limpeza
- Mensagens de progresso são exibidas durante a execução

