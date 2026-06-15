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

> **Convenção:** cada requisito é declarado em frase única e verificável no formato
> *"O sistema deve [função] [condição]"*. **Ator** indica quem aciona a função.
> **Prioridade** segue a classificação Essencial / Importante / Desejável.
> Os **critérios de aceitação** são condições objetivas e testáveis usadas para validar o requisito.

### RF01 — Cadastro de Usuário

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve permitir que um visitante crie uma conta informando nome completo, e-mail, senha e tipo de perfil (Participante ou Organizador). |
| **Ator** | Visitante |
| **Prioridade** | Essencial |
| **Critérios de aceitação** | 1. O e-mail deve ser único no sistema. 2. A senha deve ter no mínimo 8 caracteres. 3. O formato do e-mail deve ser validado antes da confirmação. 4. O tipo de perfil é de seleção obrigatória. |

### RF02 — Autenticação

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve autenticar o usuário a partir de e-mail e senha cadastrados, emitindo um token de acesso (JWT) válido. |
| **Ator** | Participante, Organizador |
| **Prioridade** | Essencial |
| **Critérios de aceitação** | 1. Credenciais inválidas devem retornar mensagem genérica, sem indicar qual campo está incorreto. 2. O logout deve encerrar a sessão no cliente. 3. O token deve possuir prazo de expiração definido. |

### RF03 — Gerenciamento de Eventos

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve permitir que o Organizador crie, edite e exclua eventos contendo nome, descrição, categoria, data, horário, local e número de vagas. |
| **Ator** | Organizador |
| **Prioridade** | Essencial |
| **Critérios de aceitação** | 1. A categoria deve ser escolhida de lista pré-definida (`Palestra`, `Workshop`, `Minicurso`, `Seminário`). 2. A data do evento deve ser igual ou posterior à data atual. 3. Somente o Organizador criador pode editar ou excluir o evento. 4. A exclusão de evento com inscrições ativas deve exigir confirmação explícita. 5. O Organizador deve poder visualizar a lista de inscritos de cada evento. |

### RF04 — Inscrição em Eventos

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve permitir que o Participante autenticado se inscreva em um evento com vagas disponíveis. |
| **Ator** | Participante |
| **Prioridade** | Essencial |
| **Critérios de aceitação** | 1. Um Participante não pode se inscrever mais de uma vez no mesmo evento. 2. A disponibilidade de vagas deve ser verificada antes de confirmar. 3. A inscrição em evento lotado deve ser bloqueada no backend. 4. O sistema deve exibir confirmação visual da inscrição. |

### RF05 — Cancelamento de Inscrição

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve permitir que o Participante cancele uma inscrição própria, liberando a vaga correspondente. |
| **Ator** | Participante |
| **Prioridade** | Essencial |
| **Critérios de aceitação** | 1. O Participante só pode cancelar inscrições próprias. 2. A vaga deve ser liberada automaticamente após o cancelamento. 3. Cancelamentos em eventos com data passada devem ser bloqueados. 4. O sistema deve solicitar confirmação antes de efetivar. |

### RF06 — Consulta e Listagem de Eventos

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve permitir que usuários autenticados consultem a listagem de eventos, com filtros por data, status e categoria. |
| **Ator** | Participante, Organizador |
| **Prioridade** | Essencial |
| **Critérios de aceitação** | 1. Cada item deve exibir nome, categoria, data, horário, local, vagas disponíveis e status. 2. O status deve ser `Disponível` ou `Lotado`. 3. Os filtros por data, status e categoria devem estar disponíveis. 4. Na área de gerenciamento, o Organizador deve visualizar apenas os próprios eventos. |

### RF07 — Controle Automático de Vagas

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve atualizar automaticamente o número de vagas e o status do evento a cada inscrição ou cancelamento. |
| **Ator** | Sistema (automático) |
| **Prioridade** | Essencial |
| **Critérios de aceitação** | 1. O contador deve ser decrementado a cada inscrição confirmada e incrementado a cada cancelamento. 2. Ao atingir zero vagas, o status deve mudar para `Lotado`. 3. Com status `Lotado`, novas inscrições devem ser bloqueadas no backend. 4. A atualização deve refletir na interface sem recarregar a página. |

### RF08 — Histórico

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve disponibilizar ao usuário o histórico de suas atividades: inscrições do Participante e eventos criados pelo Organizador. |
| **Ator** | Participante, Organizador |
| **Prioridade** | Importante |
| **Critérios de aceitação** | 1. O Participante deve visualizar todos os eventos em que se inscreveu. 2. O Organizador deve visualizar todos os eventos que criou. 3. O status de cada inscrição deve ser `Confirmada` ou `Cancelada`. 4. A lista deve ser ordenada por data do evento, do mais recente ao mais antigo. 5. Eventos já realizados devem ser identificados como `Encerrado`. |

### RF09 — Dashboard de Análise *(Módulo BI)*

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve apresentar ao Organizador um painel com métricas dos seus eventos: taxa de ocupação, distribuição por categoria, evolução de inscrições e ranking de popularidade. |
| **Ator** | Organizador |
| **Prioridade** | Importante |
| **Critérios de aceitação** | 1. A taxa de ocupação deve ser exibida em gráfico de barras. 2. A distribuição por categoria deve ser exibida em gráfico de pizza. 3. A evolução de inscrições deve ser exibida em gráfico de linha. 4. O ranking de ocupação deve ser exibido em tabela ordenada. 5. As métricas devem se restringir aos eventos do Organizador autenticado. |

### RF10 — Recomendação de Eventos *(Módulo BI)*

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve recomendar ao Participante eventos relevantes com base no seu histórico de inscrições. |
| **Ator** | Participante |
| **Prioridade** | Importante |
| **Critérios de aceitação** | 1. As recomendações devem considerar as categorias mais frequentes no histórico do Participante. 2. Devem ser exibidos apenas eventos com vagas disponíveis e data futura. 3. Eventos em que o Participante já está inscrito não devem ser recomendados. 4. Devem ser exibidas no mínimo 3 recomendações quando disponíveis. 5. Quando o histórico for insuficiente (menos de 2 inscrições), o sistema deve recorrer aos eventos mais populares (fallback). |

---

## Requisitos Não Funcionais

> Classificados por característica de qualidade conforme a norma **ISO/IEC 25010**.
> Cada requisito declara uma **métrica** e um **critério de aceitação** objetivo e verificável.

### RNF01 — Desempenho (Eficiência)

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve responder às operações principais (login, listagem, inscrição e consultas de BI) em condições normais de uso de forma ágil. |
| **Métrica** | Tempo de resposta das requisições HTTP. |
| **Critério de aceitação** | 95% das requisições devem ser respondidas em até 2 segundos. |

### RNF02 — Segurança

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve proteger as credenciais dos usuários e restringir o acesso a recursos protegidos. |
| **Métrica** | Algoritmo e fator de hash das senhas; resposta das rotas privadas sem autenticação. |
| **Critério de aceitação** | 1. Senhas armazenadas com hash bcrypt de fator ≥ 10, nunca em texto puro. 2. Rotas privadas devem retornar HTTP 401 quando o token JWT estiver ausente ou inválido. |

### RNF03 — Usabilidade (Responsividade)

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve apresentar interface legível e funcional em dispositivos móveis e desktops, incluindo os gráficos do dashboard. |
| **Métrica** | Renderização da interface em diferentes larguras de viewport. |
| **Critério de aceitação** | A interface deve renderizar corretamente em viewports de 375px (smartphone) e 1280px (desktop). |

### RNF04 — Confiabilidade (Disponibilidade)

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve operar sem falhas críticas durante a execução e a demonstração. |
| **Métrica** | Ocorrência de erros fatais durante a operação. |
| **Critério de aceitação** | A aplicação deve compilar e executar sem erros fatais durante a apresentação de 20 minutos. |

### RNF05 — Manutenibilidade

| Campo | Conteúdo |
|-------|----------|
| **Descrição** | O sistema deve seguir a arquitetura em camadas, sem regras de negócio em rotas ou controllers, com os serviços de BI isolados em sua própria camada. |
| **Métrica** | Organização do código-fonte em camadas. |
| **Critério de aceitação** | O projeto deve manter as pastas `/controllers`, `/services`, `/repositories` e `/models`, com a lógica de negócio restrita à camada de serviços. |

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
