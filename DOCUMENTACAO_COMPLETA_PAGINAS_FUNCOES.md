# 📚 Documentação Completa - Páginas e Funções do GigAgora

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Páginas Públicas](#páginas-públicas)
3. [Páginas de Autenticação](#páginas-de-autenticação)
4. [Dashboard e Páginas Principais](#dashboard-e-páginas-principais)
5. [Gerenciamento de Gigs](#gerenciamento-de-gigs)
6. [Perfil e Configurações](#perfil-e-configurações)
7. [Mensagens e Comunicação](#mensagens-e-comunicação)
8. [Agenda e Calendário](#agenda-e-calendário)
9. [Avaliações e Reputação](#avaliações-e-reputação)
10. [Desafios e Gamificação](#desafios-e-gamificação)
11. [Financeiro](#financeiro)
12. [Páginas Informativas](#páginas-informativas)
13. [Componentes Principais](#componentes-principais)
14. [Funcionalidades Técnicas](#funcionalidades-técnicas)

---

## 🎯 Visão Geral

O **GigAgora** (também conhecido como "Chama o Músico") é uma plataforma web desenvolvida em **Next.js 16** que conecta músicos e contratantes para facilitar a contratação de serviços musicais. A aplicação utiliza **Supabase** como backend (autenticação, banco de dados, storage e real-time), **Tailwind CSS** para estilização e **Radix UI** para componentes de interface.

### Tecnologias Principais
- **Framework**: Next.js 16 (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Estilização**: Tailwind CSS
- **Componentes UI**: Radix UI
- **Linguagem**: TypeScript
- **Autenticação**: Email/Password + OAuth (Google, Facebook)

---

## 🌐 Páginas Públicas

### 1. Página Inicial (`/`)
**Arquivo**: `src/app/page.tsx`

**Descrição**: Landing page principal para usuários não autenticados. Exibe informações sobre a plataforma, estatísticas públicas e exemplos de músicos e gigs recentes.

**Funcionalidades**:
- Exibe estatísticas públicas (total de usuários, gigs publicadas, cachê total)
- Lista músicos recentes com foto, nome, instrumentos e avaliação média
- Lista gigs confirmadas recentes com detalhes (título, data, localização, instrumentos)
- Header com navegação e opções de login/cadastro
- Footer com links para páginas informativas
- Redireciona automaticamente para `/dashboard` se o usuário estiver autenticado

**Componentes Utilizados**:
- `HomeHeader`
- `Logo`
- Cards de estatísticas
- Cards de músicos e gigs

**Funções RPC Utilizadas**:
- `rpc_get_public_stats()` - Estatísticas públicas
- `rpc_get_recent_musicians()` - Músicos recentes
- `rpc_get_recent_confirmed_gigs()` - Gigs confirmadas recentes

---

### 2. Como Funciona (`/como-funciona`)
**Arquivo**: `src/app/como-funciona/page.tsx`

**Descrição**: Página informativa explicando como a plataforma funciona para contratantes e músicos.

**Conteúdo**:
- Explicação do fluxo para contratantes
- Explicação do fluxo para músicos
- Destaque de funcionalidades principais
- Benefícios da plataforma

---

### 3. Sobre (`/sobre`)
**Arquivo**: `src/app/sobre/page.tsx`

**Descrição**: Página institucional contando a história, missão, visão e valores do "Chama o Músico".

**Conteúdo**:
- História da plataforma
- Missão
- Visão
- Valores

---

### 4. Contato (`/contato`)
**Arquivo**: `src/app/contato/page.tsx`

**Descrição**: Página de contato com informações e formulário para envio de mensagens.

**Funcionalidades**:
- Exibe informações de contato (email, telefone, endereço, horários)
- Formulário de contato para envio de mensagens
- Layout responsivo

---

### 5. FAQ (`/faq`)
**Arquivo**: `src/app/faq/page.tsx`

**Descrição**: Página de Perguntas Frequentes com busca e filtros por categoria.

**Funcionalidades**:
- Lista de perguntas e respostas categorizadas
- Busca por texto
- Filtros por categoria (Geral, Músico, Contratante)
- Layout responsivo

**Categorias**:
- Geral
- Músico
- Contratante

---

### 6. Termos de Uso (`/termos`)
**Arquivo**: `src/app/termos/page.tsx`

**Descrição**: Página legal com os Termos de Uso da plataforma.

**Conteúdo**:
- Termos e condições de uso
- Direitos e responsabilidades
- Políticas de uso

---

### 7. Privacidade (`/privacidade`)
**Arquivo**: `src/app/privacidade/page.tsx`

**Descrição**: Página legal com a Política de Privacidade e proteção de dados.

**Conteúdo**:
- Política de privacidade
- Proteção de dados pessoais
- Uso de cookies
- Direitos do usuário

---

## 🔐 Páginas de Autenticação

### 8. Login (`/login`)
**Arquivo**: `src/app/login/page.tsx`

**Descrição**: Página de autenticação para usuários existentes.

**Funcionalidades**:
- Login com email e senha
- Login via OAuth (Google, Facebook)
- Suporte a código de indicação na URL (`?ref=CODIGO`)
- Aplicação de tema preferido do usuário ou tema padrão
- Redirecionamento automático para `/dashboard` após login bem-sucedido
- Redirecionamento para `/signup` se o usuário não tiver conta
- Tratamento de erros de autenticação

**Fluxo OAuth**:
1. Usuário clica em botão OAuth
2. Redireciona para provedor (Google/Facebook)
3. Após autorização, retorna para `/auth/callback`
4. Callback processa autenticação e cria/atualiza perfil
5. Redireciona para `/dashboard`

---

### 9. Cadastro (`/signup`)
**Arquivo**: `src/app/signup/page.tsx`

**Descrição**: Página de cadastro para novos usuários.

**Funcionalidades**:
- Cadastro com email e senha
- Cadastro via OAuth (Google, Facebook)
- Campo opcional para código de indicação (`?ref=CODIGO`)
- Seleção de tipo de usuário (Músico ou Contratante)
- Criação automática de perfil básico (`profiles`)
- Criação automática de perfil de músico (`musician_profiles`) se aplicável
- Registro de indicação se código fornecido
- Redirecionamento para `/dashboard` após cadastro

**Dados Criados**:
- Registro em `auth.users` (Supabase Auth)
- Registro em `profiles` (perfil básico)
- Registro em `musician_profiles` (se músico)
- Registro em `referrals` (se código de indicação fornecido)

---

### 10. Callback OAuth (`/auth/callback`)
**Arquivo**: `src/app/auth/callback/route.ts`

**Descrição**: Rota de callback para processar autenticação OAuth.

**Funcionalidades**:
- Processa código de autorização OAuth
- Extrai informações do usuário (nome, foto, email)
- Cria ou atualiza perfil do usuário
- Processa código de indicação se presente
- Atualiza foto e nome do perfil se necessário
- Redireciona para `/dashboard` após sucesso

**Processamento**:
- Extrai foto de diferentes campos (Google: `avatar_url` ou `picture`, Facebook: `picture`)
- Extrai nome de diferentes campos (`full_name`, `name`, `display_name`, `first_name` + `last_name`)
- Cria perfil se não existir
- Atualiza perfil existente se necessário

---

## 🏠 Dashboard e Páginas Principais

### 11. Dashboard Principal (`/dashboard`)
**Arquivo**: `src/app/dashboard/page.tsx`

**Descrição**: Página principal do dashboard após login. Centraliza informações e ações importantes para o usuário.

**Funcionalidades**:
- **Autenticação**: Redireciona para `/login` se não autenticado
- **Layout Responsivo**: Diferentes layouts para mobile e desktop
- **Componentes Exibidos** (em ordem de prioridade):
  1. **WelcomeCard**: Card de boas-vindas para novos usuários
  2. **ProfileHeader**: Header com foto, nome e informações do perfil
  3. **ProfileCompletion**: Indicador de completude do perfil
  4. **CancellationAlertCard**: Alertas de cancelamentos de gigs (PRIORIDADE 1)
  5. **PendingInvites**: Convites pendentes que requerem ação (PRIORIDADE 2)
  6. **UpcomingConfirmedGigs**: Próximas gigs confirmadas (PRIORIDADE 3)
  7. **CompletedGigsToRate**: Gigs concluídas que precisam ser avaliadas (PRIORIDADE 4)
  8. **GigsTabs**: Abas com "Meus Gigs" (PRIORIDADE 5)
  9. **ReferralSystem**: Sistema de indicação (PRIORIDADE 6)
  10. **ThemeSelector**: Seletor de tema (PRIORIDADE 7)
  11. **Banner de Privacidade**: Informações sobre proteção de dados (apenas desktop)

**Layout**:
- Desktop: Layout completo com sidebar
- Mobile: Layout compacto, alguns componentes ocultos ou em seções colapsáveis

**Componentes Utilizados**:
- `DashboardLayoutWithSidebar`
- `WelcomeCard`
- `ProfileHeader`
- `ProfileCompletion`
- `CancellationAlertCard`
- `PendingInvites`
- `UpcomingConfirmedGigs`
- `CompletedGigsToRate`
- `GigsTabs`
- `ReferralSystem`
- `ThemeSelector`

---

## 🎵 Gerenciamento de Gigs

### 12. Lista de Gigs (`/dashboard/gigs`)
**Arquivo**: `src/app/dashboard/gigs/page.tsx`

**Descrição**: Página que lista todas as gigs disponíveis. Comportamento diferente para músicos e contratantes.

**Para Músicos**:
- Exibe gigs publicadas compatíveis com os instrumentos do músico
- Filtra por localização (raio de busca do músico)
- Mostra apenas gigs com vagas disponíveis
- Permite aceitar/recusar convites
- Atualização em tempo real de mudanças em gigs e convites

**Para Contratantes**:
- Exibe todas as gigs criadas pelo contratante
- Filtra por status (rascunho, publicada, cancelada)
- Permite criar nova gig
- Permite editar gigs existentes
- Permite deletar gigs
- Permite visualizar matches (músicos que aceitaram convites)

**Funcionalidades**:
- **Busca**: Busca por título, descrição, localização
- **Filtros**: Por status, data, instrumento, gênero
- **Real-time**: Atualizações automáticas via Supabase Realtime
- **Ações**:
  - Aceitar convite (músicos)
  - Recusar convite (músicos)
  - Ver detalhes da gig
  - Editar gig (contratantes)
  - Deletar gig (contratantes)
  - Ver matches (contratantes)

**Componentes Utilizados**:
- `GigCard`
- `GigDetailsDialog`
- `InviteCard`
- `InviteDetailsDialog`

**Funções RPC Utilizadas**:
- `rpc_get_accepted_musicians()` - Músicos que aceitaram convites
- `rpc_get_confirmed_musicians()` - Músicos confirmados

---

### 13. Criar Nova Gig (`/dashboard/gigs/new`)
**Arquivo**: `src/app/dashboard/gigs/new/page.tsx`

**Descrição**: Página para contratantes criarem novas gigs.

**Campos do Formulário**:
- **Informações Básicas**:
  - Título da gig
  - Descrição
  - Localização (nome do local)
  - Endereço completo
  - Cidade
  - Estado
  - Data e hora de início
  - Data e hora de término
  - Duração estimada
  - Intervalos (breaks)
  
- **Flyer**:
  - Upload de imagem (flyer da gig)
  - Armazenado no Supabase Storage (`gig-flyers`)
  - Validação de tipo e tamanho de arquivo

- **Vagas (Roles)**:
  - Múltiplas vagas podem ser adicionadas
  - Cada vaga contém:
    - Instrumento
    - Gênero musical
    - Habilidades necessárias
    - Cachê (valor)
  - Cálculo automático de cachê mínimo baseado em instrumento e presença de vocal

**Funcionalidades**:
- Validação de campos obrigatórios
- Upload de flyer com preview
- Adição/remoção dinâmica de vagas
- Cálculo automático de cachê mínimo
- Criação de gig como rascunho ou publicada
- Redirecionamento para lista de gigs após criação

**Validações**:
- Data de início deve ser futura
- Data de término deve ser após data de início
- Cachê deve ser positivo
- Pelo menos uma vaga deve ser adicionada

---

### 14. Editar Gig (`/dashboard/gigs/[id]/edit`)
**Arquivo**: `src/app/dashboard/gigs/[id]/edit/page.tsx`

**Descrição**: Página para contratantes editarem gigs existentes.

**Funcionalidades**:
- Carrega dados existentes da gig
- Carrega vagas (roles) existentes
- Permite editar todos os campos da gig
- Permite substituir flyer
- Permite adicionar novas vagas
- Permite editar vagas existentes
- Permite deletar vagas
- Validações similares à criação
- Redirecionamento para lista de gigs após edição

**Restrições**:
- Apenas o criador da gig pode editá-la
- Gigs confirmadas podem ter restrições de edição

---

### 15. Matches da Gig (`/dashboard/gigs/[id]/matches`)
**Arquivo**: `src/app/dashboard/gigs/[id]/matches/page.tsx`

**Descrição**: Página para contratantes visualizarem músicos que aceitaram convites para uma gig específica.

**Funcionalidades**:
- Lista músicos que aceitaram convites
- Exibe perfil completo de cada músico:
  - Foto, nome, avaliação média
  - Localização (cidade, estado)
  - Instrumentos tocados
  - Gêneros musicais
  - Habilidades
  - Setup disponível
  - Links de portfólio
  - Redes sociais
  - Taxa de presença
  - Tempo de resposta
  - Status de confiança (trusted)
  - Badges e conquistas
- Permite confirmar músico para a gig
- Permite favoritar músico
- Permite denunciar músico
- Permite iniciar conversa com músico
- Visualização de perfil público completo em modal

**Ações Disponíveis**:
- **Confirmar**: Confirma o músico para a gig (cria registro em `confirmations`)
- **Favoritar**: Adiciona músico à lista de favoritos
- **Denunciar**: Abre dialog para denunciar músico
- **Mensagem**: Inicia conversa com músico
- **Ver Perfil**: Abre modal com perfil público completo

**Componentes Utilizados**:
- `BadgeDisplay` - Exibe badges do músico
- `ReportDialog` - Dialog para denúncias
- `RatingDialog` - Dialog para avaliações (se aplicável)

**Funções RPC Utilizadas**:
- `rpc_get_accepted_musicians()` - Músicos que aceitaram
- `rpc_get_confirmed_musicians()` - Músicos confirmados

---

## 👤 Perfil e Configurações

### 16. Visualizar Perfil (`/dashboard/perfil`)
**Arquivo**: `src/app/dashboard/perfil/page.tsx`

**Descrição**: Página para visualizar o perfil completo do usuário autenticado.

**Funcionalidades**:
- Exibe informações básicas:
  - Foto de perfil
  - Nome de exibição
  - Email
  - Telefone
  - Localização (cidade, estado)
  
- Para Músicos, exibe também:
  - Biografia
  - Instrumentos tocados
  - Gêneros musicais
  - Habilidades
  - Setup disponível
  - Links de portfólio
  - Redes sociais
  - Nível de leitura de partitura
  - Repertório
  - Anos de experiência
  - Formação musical
  - Preço base
  - Raio de busca
  - Avaliação média
  - Taxa de presença
  - Tempo de resposta médio
  - Status de confiança (trusted)
  - Badges e conquistas

- Botão para editar perfil
- Redirecionamento para `/login` se não autenticado

---

### 17. Editar Perfil (`/dashboard/perfil/edit`)
**Arquivo**: `src/app/dashboard/perfil/edit/page.tsx`

**Descrição**: Página para editar informações do perfil.

**Campos Editáveis**:
- **Perfil Básico**:
  - Nome de exibição
  - Telefone
  - Cidade
  - Estado
  - Foto de perfil (upload para Supabase Storage `profile-photos`)

- **Perfil de Músico** (se aplicável):
  - Biografia
  - Instrumentos (múltipla seleção)
  - Gêneros musicais (múltipla seleção)
  - Habilidades (múltipla seleção)
  - Setup disponível (múltipla seleção)
  - Links de portfólio (múltiplos)
  - Redes sociais:
    - Instagram
    - Facebook
    - YouTube
    - TikTok
    - Spotify
    - SoundCloud
  - Nível de leitura de partitura
  - Repertório (texto livre)
  - Anos de experiência
  - Formação musical
  - Preço base
  - Raio de busca (slider)

**Funcionalidades**:
- Upload de foto com preview
- Validação de campos
- Atualização em tempo real
- Redirecionamento para perfil após salvar

**Validações**:
- Nome de exibição obrigatório
- Email não pode ser alterado (gerenciado pelo Supabase Auth)
- Foto deve ser imagem válida
- Raio de busca entre 0 e 500 km

---

## 💬 Mensagens e Comunicação

### 18. Mensagens (`/dashboard/messages`)
**Arquivo**: `src/app/dashboard/messages/page.tsx`

**Descrição**: Sistema de mensagens integrado para comunicação entre usuários.

**Funcionalidades**:
- **Lista de Conversas**:
  - Exibe todas as conversas do usuário
  - Mostra último envio, preview da última mensagem
  - Indica conversas não lidas
  - Busca por nome do outro participante
  
- **Visualização de Mensagens**:
  - Exibe histórico completo de mensagens de uma conversa
  - Diferencia mensagens enviadas e recebidas
  - Timestamp de cada mensagem
  - Scroll automático para última mensagem
  
- **Envio de Mensagens**:
  - Campo de texto para nova mensagem
  - Botão de envio
  - Validação de mensagem não vazia
  
- **Real-time**:
  - Atualização automática quando novas mensagens chegam
  - Atualização via Supabase Realtime subscriptions

**Funcionalidades Técnicas**:
- Criação automática de conversa se não existir
- Função RPC `get_or_create_conversation()` para gerenciar conversas
- Subscriptions para `messages` e `conversations`
- Filtragem de mensagens por conversa

**Componentes Utilizados**:
- Lista de conversas (sidebar)
- Área de mensagens (principal)
- Input de mensagem

**Funções RPC Utilizadas**:
- `get_or_create_conversation()` - Criar ou obter conversa existente

---

## 📅 Agenda e Calendário

### 19. Agenda (`/dashboard/agenda`)
**Arquivo**: `src/app/dashboard/agenda/page.tsx`

**Descrição**: Calendário mensal mostrando gigs confirmadas e convites pendentes.

**Funcionalidades**:
- **Visualização Mensal**:
  - Calendário mensal com todos os dias
  - Cores diferentes para:
    - Dias livres (sem gigs)
    - Dias preferidos (com convites pendentes)
    - Dias ocupados (com gigs confirmadas)
  
- **Informações Exibidas**:
  - Gigs confirmadas futuras
  - Convites pendentes
  - Detalhes de cada gig (título, horário, localização)
  
- **Ações**:
  - Download de arquivo ICS (iCalendar) com todas as gigs confirmadas
  - Visualização de detalhes da gig ao clicar

**Funcionalidades Técnicas**:
- Geração de arquivo ICS para importação em calendários (Google Calendar, Outlook, etc.)
- Cálculo de status de cada dia (livre, preferido, ocupado)
- Agrupamento de gigs por data

**Funções RPC Utilizadas**:
- `rpc_list_upcoming_confirmed_gigs()` - Gigs confirmadas futuras
- `rpc_list_pending_invites()` - Convites pendentes

**Componentes Utilizados**:
- `DownloadICSButton` - Botão para download do arquivo ICS

---

## ⭐ Avaliações e Reputação

### 20. Avaliações (`/dashboard/avaliacoes`)
**Arquivo**: `src/app/dashboard/avaliacoes/page.tsx`

**Descrição**: Página exibindo todas as avaliações públicas recebidas pelo usuário.

**Funcionalidades**:
- **Resumo**:
  - Avaliação média (estrelas)
  - Total de avaliações recebidas
  - Comentários pré-definidos mais comuns
  
- **Lista de Avaliações**:
  - Exibe cada avaliação individualmente
  - Mostra:
    - Avaliador (nome, foto)
    - Nota (1-5 estrelas)
    - Comentários pré-definidos selecionados
    - Comentário customizado (se houver)
    - Data da avaliação
    - Gig relacionada (se aplicável)
  
- **Filtros**:
  - Por nota (1-5 estrelas)
  - Por tipo de avaliador (músico, contratante)
  - Por data

**Observação Importante**:
- Esta página mostra apenas avaliações onde o usuário atual é o **avaliado**
- Não mostra avaliações feitas pelo usuário (para ver essas, usar a página de gigs concluídas)

**Componentes Utilizados**:
- Cards de avaliação
- Sistema de estrelas
- Badges para comentários pré-definidos

---

## 🏆 Desafios e Gamificação

### 21. Desafios (`/dashboard/desafios`)
**Arquivo**: `src/app/dashboard/desafios/page.tsx`

**Descrição**: Sistema de desafios e ranking para gamificação da plataforma.

**Funcionalidades**:
- **Resumo do Usuário**:
  - Tier/ranking atual
  - Total de pontos acumulados
  - Progresso para próximo nível
  - Posição no ranking geral
  
- **Lista de Desafios**:
  - Exibe todos os desafios disponíveis
  - Mostra para cada desafio:
    - Nome e descrição
    - Dificuldade (fácil, médio, difícil)
    - Pontos de recompensa
    - Progresso atual
    - Status (não iniciado, em progresso, concluído)
    - Data de conclusão (se concluído)
  
- **Filtros**:
  - Por status (todos, concluídos, em progresso, não iniciados)
  - Por dificuldade (fácil, médio, difícil)
  
- **Badges e Conquistas**:
  - Exibe badges desbloqueados
  - Mostra conquistas alcançadas

**Tipos de Desafios**:
- Completar perfil
- Aceitar primeiro convite
- Confirmar primeira gig
- Receber primeira avaliação
- Avaliar outros usuários
- E muitos outros...

**Funcionalidades Técnicas**:
- Atualização automática de progresso via triggers no banco
- Cálculo de pontos e ranking
- Sistema de tiers (bronze, prata, ouro, platina, etc.)

---

## 💰 Financeiro

### 22. Financeiro (`/dashboard/financeiro`)
**Arquivo**: `src/app/dashboard/financeiro/page.tsx`

**Descrição**: Dashboard financeiro para músicos visualizarem ganhos e estatísticas financeiras.

**Funcionalidades**:
- **Resumo Financeiro**:
  - Total ganho (todas as gigs confirmadas)
  - Ganhos nos últimos 30 dias
  - Total de horas trabalhadas
  - Média de ganhos por hora
  - Média de ganhos por gig
  
- **Ganhos Futuros**:
  - Ganhos esperados para próximas semanas
  - Lista de gigs confirmadas futuras com cachê
  
- **Gráfico de Evolução**:
  - Gráfico mostrando evolução de ganhos nos últimos 6 meses
  - Visualização mensal
  
- **Ganhos por Instrumento**:
  - Breakdown de ganhos por instrumento tocado
  - Percentual de cada instrumento no total
  
- **Controles**:
  - Toggle para ocultar/mostrar valores (privacidade)
  - Filtros por período

**Observação**:
- Esta página é exclusiva para músicos
- Contratantes não têm acesso a esta página (ou veem informações diferentes)

**Dados Calculados**:
- Soma de `cache` de todas as `gig_roles` de gigs confirmadas
- Cálculo de horas baseado em `start_time` e `end_time` das gigs
- Médias e percentuais calculados dinamicamente

---

## 📄 Páginas Informativas

Todas as páginas informativas (`/como-funciona`, `/sobre`, `/contato`, `/faq`, `/termos`, `/privacidade`) seguem um padrão similar:

- Layout responsivo
- Conteúdo estático ou dinâmico
- Navegação consistente
- Footer com links

---

## 🧩 Componentes Principais

### Componentes do Dashboard

#### `WelcomeCard`
- Exibido apenas na primeira visita ao dashboard
- Mensagem de boas-vindas personalizada
- Pode ser fechado pelo usuário

#### `ProfileHeader`
- Header com foto, nome e informações básicas do perfil
- Links rápidos para editar perfil
- Versão compacta para mobile

#### `ProfileCompletion`
- Barra de progresso mostrando completude do perfil
- Indica campos faltantes
- Link para editar perfil

#### `CancellationAlertCard`
- Alertas urgentes sobre cancelamentos de gigs
- Notificações em tempo real
- Ações rápidas (aceitar novo convite, etc.)

#### `PendingInvites`
- Lista de convites pendentes que requerem ação
- Permite aceitar/recusar convites
- Atualização em tempo real

#### `UpcomingConfirmedGigs`
- Lista de próximas gigs confirmadas
- Permite avaliar contratante após a gig
- Download de informações da gig
- Link para mensagens

#### `CompletedGigsToRate`
- Lista de gigs concluídas que precisam ser avaliadas
- Abre dialog de avaliação
- Diferencia avaliação de músico e contratante

#### `GigsTabs`
- Abas organizando diferentes tipos de gigs:
  - Minhas Gigs (criadas pelo contratante)
  - Gigs Disponíveis (para músicos)
  - Gigs Confirmadas
  - Gigs Concluídas

#### `ReferralSystem`
- Sistema de indicação
- Geração de código de indicação
- Link de compartilhamento
- Estatísticas de uso do código
- Compartilhamento via Web Share API

#### `ThemeSelector`
- Seletor de tema para personalização
- Múltiplos temas disponíveis
- Persistência da preferência
- Aplicação imediata

#### `GigCard`
- Card exibindo informações de uma gig
- Foto (flyer), título, data, localização
- Status da gig
- Ações rápidas

#### `InviteCard`
- Card exibindo informações de um convite
- Status do convite
- Informações da gig relacionada
- Ações (aceitar/recusar)

#### `RatingDialog`
- Dialog modal para avaliação de usuários
- Sistema de estrelas (1-5)
- Comentários pré-definidos (positivos e negativos)
- Comentário customizado opcional
- Validação e submissão

#### `ReportDialog`
- Dialog para denunciar usuários
- Motivos de denúncia
- Descrição detalhada
- Submissão anônima

#### `BadgeDisplay`
- Exibição de badges e conquistas
- Tooltips com descrição
- Cores e ícones diferentes por tipo

#### `LocationInfo`
- Componente para exibir informações de localização
- Mapa (se disponível)
- Endereço formatado
- Distância calculada

#### `ShareGigButton`
- Botão para compartilhar gig
- Geração de link compartilhável
- Compartilhamento via Web Share API

#### `DownloadICSButton`
- Botão para download de arquivo ICS
- Geração de arquivo iCalendar
- Compatível com Google Calendar, Outlook, etc.

---

## ⚙️ Funcionalidades Técnicas

### Autenticação
- **Supabase Auth**: Gerenciamento de autenticação
- **Email/Password**: Login tradicional
- **OAuth**: Google e Facebook
- **Sessões**: Gerenciadas via cookies (SSR)
- **Proteção de Rotas**: Middleware e verificações server-side

### Banco de Dados
- **PostgreSQL**: Banco de dados principal (Supabase)
- **RLS (Row Level Security)**: Políticas de segurança
- **RPC Functions**: Funções otimizadas para queries complexas
- **Triggers**: Atualização automática de estatísticas
- **Real-time**: Subscriptions para atualizações em tempo real

### Storage
- **Supabase Storage**: Armazenamento de arquivos
- **Buckets**:
  - `profile-photos`: Fotos de perfil
  - `gig-flyers`: Flyers de gigs
- **RLS Policies**: Controle de acesso aos arquivos
- **Upload**: Via cliente Supabase

### Real-time
- **Supabase Realtime**: Atualizações em tempo real
- **Subscriptions**: Para mensagens, convites, gigs, confirmations
- **Otimização**: Subscriptions específicas por página/componente

### RPC Functions Principais
- `rpc_get_public_stats()` - Estatísticas públicas
- `rpc_get_recent_musicians()` - Músicos recentes
- `rpc_get_recent_confirmed_gigs()` - Gigs confirmadas recentes
- `rpc_list_pending_invites()` - Convites pendentes do usuário
- `rpc_list_upcoming_confirmed_gigs()` - Gigs confirmadas futuras
- `rpc_get_accepted_musicians()` - Músicos que aceitaram convites
- `rpc_get_confirmed_musicians()` - Músicos confirmados
- `rpc_accept_invite()` - Aceitar convite
- `rpc_decline_invite()` - Recusar convite
- `rpc_create_referral_code()` - Criar código de indicação
- `rpc_register_referral()` - Registrar indicação
- `get_or_create_conversation()` - Criar ou obter conversa

### Tabelas Principais do Banco
- `profiles` - Perfis básicos dos usuários
- `musician_profiles` - Perfis detalhados de músicos
- `gigs` - Gigs criadas
- `gig_roles` - Vagas de cada gig
- `invites` - Convites enviados para músicos
- `confirmations` - Confirmações de músicos para gigs
- `ratings` - Avaliações entre usuários
- `messages` - Mensagens entre usuários
- `conversations` - Conversas entre usuários
- `referral_codes` - Códigos de indicação
- `referrals` - Registros de indicações
- `challenges` - Desafios disponíveis
- `user_challenges` - Progresso dos usuários nos desafios
- `user_badges` - Badges desbloqueados pelos usuários
- `favorites` - Favoritos (músicos favoritados por contratantes)
- `reports` - Denúncias de usuários
- `cancellation_notifications` - Notificações de cancelamento

### Estilização
- **Tailwind CSS**: Framework de utilitários CSS
- **Radix UI**: Componentes acessíveis
- **Temas**: Sistema de temas personalizáveis
- **Responsividade**: Mobile-first design
- **Dark Mode**: Suporte a modo escuro (via temas)

### Performance
- **Server-Side Rendering (SSR)**: Páginas renderizadas no servidor
- **Client-Side Rendering (CSR)**: Componentes interativos no cliente
- **Code Splitting**: Divisão automática de código
- **Image Optimization**: Otimização de imagens via Next.js Image
- **Caching**: Cache de queries e dados estáticos

---

## 📝 Notas Finais

### Fluxo Principal para Contratantes
1. Cadastro/Login
2. Criar gig (`/dashboard/gigs/new`)
3. Publicar gig
4. Receber aceitações de convites
5. Visualizar matches (`/dashboard/gigs/[id]/matches`)
6. Confirmar músicos
7. Avaliar músicos após gigs concluídas

### Fluxo Principal para Músicos
1. Cadastro/Login (com código de indicação opcional)
2. Completar perfil (`/dashboard/perfil/edit`)
3. Visualizar gigs disponíveis (`/dashboard/gigs`)
4. Aceitar/recusar convites
5. Ser confirmado pelo contratante
6. Participar da gig
7. Avaliar contratante após gig concluída
8. Receber avaliações
9. Acompanhar ganhos (`/dashboard/financeiro`)

### Recursos Adicionais
- Sistema de mensagens para comunicação direta
- Agenda para visualizar gigs confirmadas
- Desafios para gamificação
- Sistema de indicação para crescimento
- Badges e conquistas
- Avaliações bilaterais
- Denúncias para segurança
- Favoritos para músicos preferidos

---

**Última Atualização**: Documento criado com base na análise completa do código-fonte do projeto GigAgora.

