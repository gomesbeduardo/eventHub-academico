# EventHub Acadêmico

> Plataforma web de gerenciamento de eventos acadêmicos com módulo de BI e recomendações personalizadas.

**Versão:** 2.0 · **Disciplina:** Análise e Projeto de Sistemas · **Status:** Em desenvolvimento

---

## Sumário

- [Visão Geral](#visão-geral)
- [Público-Alvo](#público-alvo)
- [Equipe](#equipe)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Design Patterns](#design-patterns)
- [Requisitos Funcionais](#requisitos-funcionais)
- [Requisitos Não Funcionais](#requisitos-não-funcionais)
- [Módulo de BI e Recomendações](#módulo-de-bi-e-recomendações)
- [API — Endpoints](#api--endpoints)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Como Rodar](#como-rodar)
- [Backlog](#backlog)

---

## Visão Geral

Instituições de ensino realizam frequentemente eventos acadêmicos como palestras, workshops e minicursos. O controle desses eventos é feito de forma manual — planilhas, formulários dispersos e grupos de mensagens — gerando os seguintes problemas:

- Excesso de inscrições além da capacidade disponível do espaço
- Falta de controle centralizado sobre vagas por evento
- Dificuldade para organizar e acompanhar a lista de participantes
- Ausência de dados que permitam ao organizador entender quais eventos funcionam
- Participantes não recebem sugestões relevantes de acordo com seus interesses

O **EventHub Acadêmico** resolve isso entregando:

- Gerenciamento completo do ciclo de vida de eventos acadêmicos
- Controle automático de vagas com atualização em tempo real
- **Módulo de BI** com dashboard de métricas para organizadores
- **Motor de recomendações** personalizado para participantes

---

## Público-Alvo

| Perfil | Descrição |
|--------|-----------|
| **Organizador** | Docentes, coordenadores ou membros de centros acadêmicos. Cria e gerencia eventos; acessa o dashboard de BI para analisar desempenho. |
| **Participante** | Alunos e membros da comunidade acadêmica. Inscreve-se em eventos e recebe recomendações personalizadas baseadas no seu histórico. |

**Contexto institucional:** Universidades, Institutos Federais, Centros Acadêmicos e Empresas Juniores.

---

## Equipe

| Papel | Integrante | Responsabilidades |
|-------|-----------|-------------------|
| **Product Owner** | — | Visão do produto, priorização do backlog, testes de aceitação, validação de entregas |
| **Desenvolvedor 1** | — | Backend: autenticação, CRUD de eventos (com categoria), AnalyticsService, Factory Method |
| **Desenvolvedor 2** | — | Inscrições, controle de vagas, histórico, dashboard frontend (Recharts), RecommendationService, Observer |

---

## Stack Tecnológica

| Função | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | React + TypeScript + Vite | Componentes reativos, tipagem estática, ecossistema maduro |
| Gráficos / BI | Recharts | Biblioteca React nativa para gráficos de barras, linhas e pizza |
| Backend | Node.js + Express + TypeScript | Leve, rápido de configurar, excelente suporte a APIs REST |
| Banco de Dados | PostgreSQL | Robusto e relacional — queries de agregação do BI funcionam nativamente com SQL |
| ORM | Prisma | Abstrai SQL, gera tipos TypeScript automáticos, facilita migrations |
| Autenticação | JWT (JSON Web Tokens) | Stateless, fácil de integrar com React e Express |
| Hash de Senhas | bcrypt (fator ≥ 10) | Padrão da indústria, cobre RNF02 |
| Observabilidade | Pino | Logs estruturados em JSON |
| Versionamento | GitHub | Exigido pelo enunciado para entrega do código-fonte |

---

## Arquitetura

**Padrão:** Arquitetura em Camadas (Layered Architecture) com padrão MVC no backend.

Cada camada se comunica apenas com a camada imediatamente abaixo. Os módulos de BI e Recomendações seguem o mesmo fluxo: `Controller → Service → Repository`.

```
┌─────────────────────────────────────────────────────────┐
│  Camada 1 — Apresentação (Frontend)                      │
│  React + TypeScript · Recharts · React Router            │
│  Formulários, listagens, dashboard BI, widget de         │
│  recomendações. Comunica via HTTP/REST.                  │
├─────────────────────────────────────────────────────────┤
│  Camada 2 — Aplicação / Controllers (Express)            │
│  AuthController · EventController                        │
│  AnalyticsController · RecommendationController          │
│  Recebe e valida requisições HTTP. Delega a Services.    │
├─────────────────────────────────────────────────────────┤
│  Camada 3 — Serviços / Business Logic (TypeScript)       │
│  AuthService · EventService (Observer)                   │
│  AnalyticsService · RecommendationService (Strategy)     │
│  UserFactory (Factory Method)                            │
│  Toda a lógica de negócio + BI.                          │
├─────────────────────────────────────────────────────────┤
│  Camada 4 — Repositório / Data Access (Prisma)           │
│  UserRepository · EventRepository                        │
│  RegistrationRepository · AnalyticsRepository            │
│  Abstrai o banco. Queries de agregação do BI aqui.       │
├─────────────────────────────────────────────────────────┤
│  Camada 5 — Banco de Dados (PostgreSQL)                  │
│  Persistência com migrations via Prisma.                 │
└─────────────────────────────────────────────────────────┘
```

---

## Design Patterns

### DP01 — Observer (Comportamental)

**Problema:** Quando um evento atinge o limite de vagas, múltiplos componentes precisam reagir (bloquear inscrições, atualizar status). Sem o Observer, o `EventService` teria referências diretas a cada módulo, criando acoplamento rígido.

**Onde:** `EventService` (RF07). O serviço notifica os Observers registrados toda vez que o status de vagas muda.

```
EventService
    │
    ├── VacancyObserver  →  atualiza contador no banco
    └── StatusObserver   →  reflete status na resposta da API
```

**Por que:** Desacopla o serviço central das reações periféricas. Adicionar novas reações não exige alterar o `EventService` (Open/Closed Principle).

```typescript
interface Observer { update(event: Event): void }

class EventService {
  private observers: Observer[] = []
  subscribe(obs: Observer) { this.observers.push(obs) }
  private notify(event: Event) { this.observers.forEach(o => o.update(event)) }

  async registerParticipant(eventId: string, userId: string) {
    // valida disponibilidade, persiste inscrição...
    this.notify(updatedEvent)  // dispara todos os observers
  }
}
```

---

### DP02 — Factory Method (Criacional)

**Problema:** Dois tipos de usuário com permissões distintas (Participante e Organizador). Instanciar diretamente cada tipo espalharia condicionais por todo o código.

**Onde:** `UserFactory.create(type, data)` no cadastro (RF01). Retorna `ParticipantUser` ou `OrganizerUser`, cada um com seus métodos de permissão.

**Por que:** Centraliza a lógica de criação. Adicionar um novo perfil no futuro requer apenas uma nova subclasse.

```typescript
abstract class User {
  abstract canCreateEvent(): boolean
  abstract canRegisterToEvent(): boolean
}
class ParticipantUser extends User {
  canCreateEvent()     { return false }
  canRegisterToEvent() { return true  }
}
class OrganizerUser extends User {
  canCreateEvent()     { return true  }
  canRegisterToEvent() { return false }
}
class UserFactory {
  static create(type: "participant" | "organizer", data: UserDTO): User {
    if (type === "organizer") return new OrganizerUser(data)
    return new ParticipantUser(data)
  }
}
```

---

### DP03 — Strategy (Comportamental) — Módulo de Recomendações

**Problema:** O motor de recomendação precisa usar algoritmos diferentes dependendo do participante: usuários com histórico usam filtragem por categoria (content-based); usuários sem histórico usam popularidade geral. Hard-codar os dois algoritmos no mesmo serviço tornaria o código rígido e difícil de testar.

**Onde:** `RecommendationService` (RF10). Seleciona a estratégia em tempo de execução.

| Condição | Estratégia |
|----------|-----------|
| ≥ 2 inscrições confirmadas | `ContentBasedStrategy` — categorias favoritas do histórico |
| < 2 inscrições | `PopularityBasedStrategy` — eventos mais populares (fallback) |

**Por que:** Isola cada algoritmo em uma classe testável. Trocar ou adicionar uma estratégia não exige modificar o `RecommendationService`.

```typescript
interface RecommendationStrategy {
  recommend(userId: string): Promise<Event[]>
}

class RecommendationService {
  private strategy: RecommendationStrategy

  async getRecommendations(userId: string): Promise<Event[]> {
    const count = await this.registrationRepo.countByUser(userId)
    this.setStrategy(count >= 2 ? new ContentBasedStrategy() : new PopularityBasedStrategy())
    return this.strategy.recommend(userId)
  }
}
```

---

## Requisitos Funcionais

### RF01 — Cadastro de Usuários
Perfil: **Participante / Organizador**

- Campos obrigatórios: nome completo, e-mail, senha e tipo de perfil
- E-mail deve ser único no sistema
- Senha com no mínimo 8 caracteres
- Tipo de perfil (Participante ou Organizador) selecionado obrigatoriamente
- Validação do formato do e-mail antes de confirmar o cadastro

### RF02 — Autenticação
Perfil: **Participante / Organizador**

- Login com e-mail e senha cadastrados
- Mensagem de erro em credenciais inválidas, sem indicar qual campo está incorreto
- Logout encerra a sessão e invalida o token de acesso
- Recuperação de senha via link enviado ao e-mail do usuário
- Sessão expira automaticamente após período de inatividade

### RF03 — Gerenciamento de Eventos
Perfil: **Organizador**

- Campos do evento: nome, descrição, categoria, data, horário, local e número de vagas
- Categoria obrigatória escolhida de lista pré-definida: `Palestra`, `Workshop`, `Minicurso`, `Seminário`
- Data do evento deve ser igual ou posterior à data atual
- Somente o organizador criador pode editar ou excluir o evento
- Ao excluir evento com inscrições ativas, o sistema exige confirmação explícita
- Organizador pode visualizar a lista completa de inscritos em cada evento

### RF04 — Inscrição em Eventos
Perfil: **Participante**

- Apenas usuários Participante autenticados podem realizar inscrições
- Um participante não pode se inscrever no mesmo evento mais de uma vez
- O sistema verifica disponibilidade de vagas antes de confirmar
- Inscrição em evento Lotado é bloqueada no backend
- O participante recebe confirmação visual da inscrição realizada

### RF05 — Cancelamento de Inscrição
Perfil: **Participante**

- Participante cancela somente suas próprias inscrições
- A vaga é liberada automaticamente no evento após o cancelamento
- Cancelamentos em eventos com data passada não são permitidos
- O sistema solicita confirmação antes de efetivar o cancelamento
- O histórico registra o cancelamento com data e hora

### RF06 — Consulta e Listagem de Eventos
Perfil: **Participante / Organizador**

- Todos os usuários autenticados podem visualizar a listagem
- Cada item exibe: nome, categoria, data, horário, local, vagas disponíveis e status
- Status do evento: `Disponível` ou `Lotado`
- Filtros disponíveis: por data, por status e por categoria
- Organizadores visualizam exclusivamente seus próprios eventos na área de gerenciamento

### RF07 — Controle de Vagas
Perfil: **Sistema (automático)**

- Contador de vagas decrementado a cada inscrição confirmada
- Contador de vagas incrementado a cada cancelamento
- Quando vagas chegam a zero, status muda automaticamente para Lotado
- Com status Lotado, novas inscrições são bloqueadas no backend
- A atualização reflete-se na interface sem necessidade de recarregar a página

### RF08 — Histórico
Perfil: **Participante / Organizador**

- Participantes visualizam todos os eventos em que se inscreveram
- Organizadores visualizam todos os eventos que criaram
- Histórico exibe status de cada inscrição: `Confirmada` ou `Cancelada`
- Ordenado por data do evento, do mais recente ao mais antigo
- Eventos já realizados são identificados visualmente como `Encerrado`

### RF09 — Dashboard de Análise para Organizadores *(Módulo BI)*
Perfil: **Organizador**

- Taxa de ocupação de cada evento exibida em gráfico de barras
- Distribuição de eventos por categoria exibida em gráfico de pizza
- Evolução de inscrições ao longo do tempo exibida em gráfico de linha
- Ranking dos eventos com maior taxa de ocupação (tabela ordenada)
- Métricas visíveis apenas para os eventos do próprio organizador autenticado

### RF10 — Recomendação de Eventos para Participantes *(Módulo BI)*
Perfil: **Participante**

- Sistema identifica as categorias mais frequentes no histórico do participante
- Recomendações exibem apenas eventos com vagas disponíveis e datas futuras
- Eventos em que o participante já está inscrito não são recomendados
- Mínimo de 3 recomendações exibidas quando disponíveis
- Fallback para eventos mais populares quando histórico for insuficiente (menos de 2 inscrições)

---

## Requisitos Não Funcionais

| ID | Nome | Descrição | Como Medir |
|----|------|-----------|-----------|
| RNF01 | Desempenho | Operações principais (listagem, inscrição, login, queries de BI) respondidas em no máximo 2 segundos em condições normais | Tempo de resposta < 2s para 95% das requisições HTTP |
| RNF02 | Segurança | Senhas armazenadas com hash bcrypt, fator de custo ≥ 10. Rotas privadas exigem token JWT válido. Nenhuma senha em texto puro | Hash bcrypt (custo ≥ 10) no cadastro; rotas privadas retornam 401 sem token |
| RNF03 | Responsividade | Interface funcional e legível em smartphones (≥ 375px) e desktops (≥ 1280px), incluindo os gráficos do dashboard de BI | Interface renderiza corretamente em viewport de 375px e 1280px |
| RNF04 | Disponibilidade | Sistema sem falhas críticas durante toda a demonstração. Aplicação compila e executa no ambiente de apresentação | Aplicação executa sem erros fatais durante a apresentação de 20 minutos |
| RNF05 | Manutenibilidade | Código organizado na arquitetura em camadas. Sem regras de negócio em rotas ou controllers. Serviços de BI isolados em sua própria camada | Pastas: `/controllers`, `/services`, `/repositories`, `/models` |

---

## Módulo de BI e Recomendações

O módulo é dividido em dois sub-módulos com propósitos complementares. Ambos consomem os dados já existentes no sistema — nenhum banco ou serviço externo é necessário.

| Sub-módulo | Para quem | Valor entregue |
|-----------|----------|----------------|
| Analytics | Organizadores | Métricas de desempenho dos eventos: ocupação, cancelamentos, tendências por categoria |
| Recomendações | Participantes | Sugestão de novos eventos relevantes baseada no histórico e nos gostos do participante |

### Analytics (RF09)

| Métrica | Fórmula | Visualização | Componente |
|---------|---------|-------------|-----------|
| Taxa de Ocupação | (inscrições confirmadas ÷ total de vagas) × 100 por evento | Barras | `OccupancyChart` |
| Distribuição por Categoria | Contagem de eventos agrupados por categoria | Pizza | `CategoryPieChart` |
| Tendência de Inscrições | Contagem de novas inscrições por semana | Linha | `TrendLineChart` |
| Ranking de Popularidade | Eventos ordenados por taxa de ocupação | Tabela | `EventRankTable` |

### Recomendações (RF10)

| Passo | Ação | Detalhe |
|-------|------|---------|
| 1 | Avaliar histórico | Contar inscrições confirmadas. Se ≥ 2: `ContentBasedStrategy`. Se < 2: `PopularityBasedStrategy`. |
| 2a | ContentBased: identificar perfil | Top-3 categorias mais frequentes no histórico (`GROUP BY categoria ORDER BY COUNT DESC LIMIT 3`) |
| 2b | ContentBased: buscar eventos | Eventos futuros nessas categorias com vagas disponíveis, excluindo os já inscritos |
| 2c | ContentBased: ordenar | Por taxa de ocupação DESC — os mais procurados aparecem primeiro |
| 3 | PopularityBased: fallback | Eventos futuros com maior taxa de ocupação geral |
| 4 | Retornar resultado | Top-5 eventos como lista de cards (nome, categoria, data, vagas) |

---

## API — Endpoints

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/register` | Cadastro de usuário | — |
| `POST` | `/api/auth/login` | Login, retorna JWT | — |

### Eventos

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/events` | Listar eventos (com filtros) | JWT |
| `POST` | `/api/events` | Criar evento | JWT + Organizador |
| `GET` | `/api/events/mine` | Eventos do organizador autenticado | JWT + Organizador |
| `PUT` | `/api/events/:id` | Editar evento | JWT + Organizador |
| `DELETE` | `/api/events/:id` | Excluir evento | JWT + Organizador |
| `GET` | `/api/events/:id/registrations` | Lista de inscritos | JWT + Organizador |
| `POST` | `/api/events/:id/register` | Inscrever-se no evento | JWT + Participante |
| `DELETE` | `/api/events/:id/register` | Cancelar inscrição | JWT + Participante |
| `GET` | `/api/registrations/history` | Histórico do participante | JWT + Participante |

### Analytics (BI)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/analytics/:organizerId/metrics` | Taxa de ocupação + distribuição por categoria | JWT + Organizador |
| `GET` | `/api/analytics/:organizerId/trends` | Evolução de inscrições por semana | JWT + Organizador |
| `GET` | `/api/analytics/:organizerId/ranking` | Ranking de eventos por popularidade | JWT + Organizador |

### Recomendações

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/recommendations/:participantId` | Top-5 eventos recomendados | JWT + Participante |

---

## Estrutura de Pastas

```
eventHub/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Models: User, Event, Registration (enums incluídos)
│   └── src/
│       ├── controllers/
│       │   ├── AuthController.ts
│       │   ├── EventController.ts
│       │   ├── AnalyticsController.ts
│       │   └── RecommendationController.ts
│       ├── services/
│       │   ├── AuthService.ts
│       │   ├── EventService.ts        # Observer (DP01)
│       │   ├── AnalyticsService.ts
│       │   └── RecommendationService.ts  # Strategy (DP03)
│       ├── repositories/
│       │   ├── UserRepository.ts
│       │   ├── EventRepository.ts
│       │   ├── RegistrationRepository.ts
│       │   └── AnalyticsRepository.ts  # Queries SQL de agregação
│       ├── models/
│       │   ├── User.ts               # UserFactory + Factory Method (DP02)
│       │   ├── Observer.ts           # Interface + VacancyObserver + StatusObserver
│       │   └── RecommendationStrategy.ts  # Interface Strategy
│       ├── middlewares/
│       │   └── auth.ts               # JWT verify + requireRole
│       ├── routes/
│       │   └── index.ts
│       └── utils/
│           ├── logger.ts             # Pino
│           └── prisma.ts             # PrismaClient singleton
└── frontend/
    ├── index.html
    └── src/
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── EventsPage.tsx         # RF04–RF06
        │   └── DashboardPage.tsx      # RF09 — Recharts
        ├── components/               # Componentes reutilizáveis (a implementar)
        ├── context/
        │   └── AuthContext.tsx        # Sessão JWT global
        ├── services/
        │   └── api.ts                 # Axios + interceptors JWT
        └── types/
            └── index.ts               # Tipos compartilhados
```

---

## Como Rodar

### Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente (ou via Docker)

### 1. Clonar o repositório

```bash
git clone https://github.com/gomesbeduardo/eventHub-academico.git
cd eventHub-academico
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Preencher o `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/eventhub_db"
JWT_SECRET="seu_segredo_aqui"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
```

```bash
npm install
npm run prisma:migrate   # cria as tabelas no banco
npm run dev              # inicia em modo desenvolvimento
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

O frontend já está configurado com proxy para `http://localhost:3001` via Vite.

### Scripts disponíveis

#### Backend
| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia com hot-reload (ts-node-dev) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run start` | Executa build compilado |
| `npm run prisma:migrate` | Executa migrations |
| `npm run prisma:studio` | Abre interface visual do banco |

#### Frontend
| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento Vite |
| `npm run build` | Gera build de produção |
| `npm run preview` | Pré-visualiza o build de produção |

---

## Backlog

| ID | Descrição | Prioridade | Responsável |
|----|-----------|-----------|-------------|
| RF01.1 | Cadastro de usuário Participante com validação | Alta | Dev 1 |
| RF01.2 | Cadastro de usuário Organizador com validação | Alta | Dev 1 |
| RF02.1 | Login com e-mail e senha + token JWT | Alta | Dev 1 |
| RF02.2 | Logout e invalidação de sessão | Alta | Dev 1 |
| RF02.3 | Recuperação de senha via link por e-mail | Média | Dev 1 |
| RF03.1 | Cadastro de evento com campo categoria obrigatório | Alta | Dev 1 |
| RF03.2 | Edição de evento pelo Organizador | Média | Dev 1 |
| RF03.3 | Exclusão de evento com confirmação | Média | Dev 1 |
| RF03.4 | Visualização da lista de inscritos pelo Organizador | Média | Dev 2 |
| RF04 | Inscrição de Participante em evento disponível | Alta | Dev 2 |
| RF05 | Cancelamento de inscrição com liberação de vaga | Alta | Dev 2 |
| RF06 | Listagem de eventos com filtros por data, status e categoria | Alta | Dev 2 |
| RF07 | Controle automático de vagas com atualização de status | Alta | Dev 2 |
| RF08.1 | Histórico de inscrições do Participante | Média | Dev 2 |
| RF08.2 | Histórico de eventos criados pelo Organizador | Média | Dev 1 |
| RF09.1 | AnalyticsService + AnalyticsRepository (queries de métricas) | Alta | Dev 1 |
| RF09.2 | Dashboard frontend com Recharts (barras, pizza, linha, tabela) | Alta | Dev 2 |
| RF10.1 | RecommendationService com ContentBased e PopularityBased Strategy | Alta | Dev 2 |
| RF10.2 | Widget de recomendações na interface do Participante | Média | Dev 2 |
| DP01 | Observer no EventService — controle de vagas | Alta | Dev 2 |
| DP02 | Factory Method na UserFactory — criação de usuários | Alta | Dev 1 |
| DP03 | Strategy no RecommendationService — algoritmo de recomendação | Alta | Dev 2 |
| RNF02 | Hash de senhas com bcrypt (fator ≥ 10) | Alta | Dev 1 |
| RNF03 | Responsividade da interface (375px e 1280px, incluindo gráficos) | Média | PO |
| RNF05 | Estrutura de pastas por camadas: /controllers /services /repositories | Alta | Dev 1 |
| EXTRA | PostgreSQL + logs estruturados (Pino) — ponto extra | Baixa | Dev 2 |
