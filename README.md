# EventHub Acadêmico

Plataforma web de gerenciamento de eventos acadêmicos com módulo de BI e recomendações personalizadas.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript + Vite + Recharts |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL |
| Auth | JWT + bcrypt |
| Logs | Pino |

## Estrutura

```
eventHub/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── controllers/   # AuthController, EventController, AnalyticsController, RecommendationController
│       ├── services/      # AuthService, EventService (Observer), AnalyticsService, RecommendationService (Strategy)
│       ├── repositories/  # UserRepository, EventRepository, RegistrationRepository, AnalyticsRepository
│       ├── models/        # User (Factory Method), Observer, RecommendationStrategy
│       ├── middlewares/   # auth (JWT)
│       ├── routes/
│       └── utils/
└── frontend/
    └── src/
        ├── pages/         # LoginPage, RegisterPage, EventsPage, DashboardPage
        ├── components/
        ├── context/       # AuthContext
        ├── services/      # api (axios)
        └── types/
```

## Design Patterns

| Pattern | Onde |
|---------|------|
| **Observer** (Comportamental) | `EventService` — notifica observers ao alterar vagas |
| **Factory Method** (Criacional) | `UserFactory` — cria `ParticipantUser` ou `OrganizerUser` |
| **Strategy** (Comportamental) | `RecommendationService` — `ContentBasedStrategy` ou `PopularityBasedStrategy` |

## Como rodar

### Pré-requisitos
- Node.js 18+
- PostgreSQL rodando

### Backend
```bash
cd backend
cp .env.example .env   # preencher DATABASE_URL e JWT_SECRET
npm install
npm run prisma:migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

## Requisitos Funcionais

| ID | Descrição |
|----|-----------|
| RF01 | Cadastro de usuários (Participante / Organizador) |
| RF02 | Autenticação com JWT |
| RF03 | Gerenciamento de eventos (CRUD) |
| RF04 | Inscrição em eventos |
| RF05 | Cancelamento de inscrição |
| RF06 | Consulta e listagem com filtros |
| RF07 | Controle automático de vagas |
| RF08 | Histórico de inscrições |
| RF09 | Dashboard de BI para organizadores |
| RF10 | Recomendação de eventos para participantes |
