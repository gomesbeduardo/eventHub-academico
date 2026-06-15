# AGENTS.md — Contexto Obrigatório para IAs

> **LEIA ESTE ARQUIVO ANTES DE TOCAR EM QUALQUER COISA.**
> Qualquer IA, agente ou ferramenta que for modificar este repositório **deve** entender
> o projeto, a arquitetura e as regras abaixo **antes** de escrever, editar ou apagar código.
> Este é um trabalho acadêmico avaliado pela **correta aplicação dos conceitos** — não
> apenas pelo funcionamento. Quebrar a arquitetura ou os padrões custa nota.

---

## 0. Regras de ouro (não negociáveis)

1. **NÃO mude o padrão arquitetural.** O projeto é **Arquitetura em Camadas + MVC**. O fluxo é sempre:
   `Controller → Service → Repository → Prisma → PostgreSQL`. Nunca pule camadas.
2. **NÃO coloque regra de negócio em controller, rota ou repositório.** Regra de negócio vive **só** na camada de Services.
3. **NÃO remova nem descaracterize os 3 Design Patterns** (Observer, Factory Method, Strategy). Eles são item avaliado.
4. **NÃO troque a stack** (React, Express, Prisma, PostgreSQL, JWT, bcrypt, Pino) sem pedido explícito do dono do repositório.
5. **NÃO prometa no README o que não está implementado.** Regra do enunciado: todo requisito declarado precisa existir no código. Se não vai implementar, não escreva como pronto.
6. **Idioma:** documentação, mensagens de erro e UI em **português**. Código (nomes de variáveis, funções, classes) em **inglês**, seguindo o que já existe.
7. **Antes de finalizar qualquer mudança**, rode os type-checks (seção 9). Os dois projetos devem compilar (`exit 0`).
8. Quando terminar uma tarefa, atualize o `TAREFAS.md` (marque o que foi feito).

---

## 1. O que é o projeto

**EventHub Acadêmico** — plataforma web de gerenciamento de eventos acadêmicos (palestras, workshops, minicursos, seminários) com dois módulos de inteligência:

- **Analytics (BI):** dashboard de métricas para organizadores (ocupação, categorias, tendências, ranking).
- **Recomendações:** sugestão personalizada de eventos para participantes, com base no histórico.

**Dois perfis de usuário:** `ORGANIZER` (cria/gerencia eventos, vê BI) e `PARTICIPANT` (inscreve-se, recebe recomendações).

**Problema resolvido:** controle manual de eventos (planilhas, formulários soltos) gera excesso de inscrições, falta de controle de vagas e ausência de dados de desempenho.

---

## 2. Restrições do trabalho acadêmico (o enunciado)

O que o professor exige — **tudo isto precisa continuar verdadeiro**:

| Exigência | Estado | Observação para a IA |
|-----------|--------|----------------------|
| Equipe de até 4 (aqui são **3**: 1 PO + 2 Devs) | OK | Não inventar mais integrantes. |
| 5 RF + 5 RNF, todos implementados | Parcial | Há 10 RF documentados. Todo RF declarado tem que existir no código. |
| Documento de Requisitos no formato correto | OK | RF/RNF padronizados no README (frase "O sistema deve…", ator, prioridade, critérios; RNF por ISO/IEC 25010). |
| 1 padrão arquitetural, justificado | OK | Camadas + MVC. **Manter.** |
| ≥ 2 Design Patterns, explicados | OK | Há 3. **Manter os 3.** |
| Product Backlog (ID, descrição, prioridade, responsável) | OK | Tabela no README. |
| Aplicação compila e roda | OK | Validar sempre (seção 9). |
| Entrega via GitHub | OK | — |
| **BÔNUS:** Banco de Dados **+** Observabilidade (precisa dos dois) | DB OK / Observabilidade fraca | PostgreSQL + Prisma prontos. Observabilidade (Pino) ainda precisa de log por requisição — ver `TAREFAS.md`. |

---

## 3. Arquitetura (não desviar)

```
Camada 1 — Apresentação        frontend/src (React + TS, Recharts, React Router)
Camada 2 — Controllers         backend/src/controllers   (recebe/valida HTTP, delega)
Camada 3 — Services            backend/src/services       (TODA a regra de negócio)
Camada 4 — Repositories        backend/src/repositories   (acesso a dados via Prisma)
Camada 5 — Banco               PostgreSQL (migrations via Prisma)
```

Regras de fluxo:
- Controller **nunca** chama Repository nem Prisma direto. Só Service.
- Service **nunca** lida com `req`/`res`. Recebe dados, devolve dados/lança erro.
- Repository **nunca** tem regra de negócio. Só queries.
- Models (`backend/src/models`) guardam os Design Patterns e tipos de domínio.

---

## 4. Design Patterns (preservar e entender)

| Padrão | Tipo | Onde | O que faz |
|--------|------|------|-----------|
| **Observer** (DP01) | Comportamental | `models/Observer.ts` + `services/EventService.ts` | Notifica observers quando as vagas/status de um evento mudam. `EventService.notify()` chama `update()` em cada observer após inscrição/cancelamento. |
| **Factory Method** (DP02) | Criacional | `models/User.ts` | `UserFactory.create(role, data)` devolve `OrganizerUser` ou `ParticipantUser`, cada um com regras de permissão (`canCreateEvent`, `canRegisterToEvent`). |
| **Strategy** (DP03) | Comportamental | `models/RecommendationStrategy.ts` + `services/RecommendationService.ts` | Escolhe o algoritmo de recomendação em runtime: `ContentBasedStrategy` (≥2 inscrições) ou `PopularityBasedStrategy` (fallback). |

Ao mexer nessas áreas: **mantenha a interface do padrão.** Não substitua por `if/else` inline. Adicionar comportamento = nova subclasse/observer/strategy, não modificar o núcleo (Open/Closed).

---

## 5. Stack

- **Frontend:** React + TypeScript + Vite, Recharts (gráficos BI), React Router, Axios.
- **Backend:** Node.js + Express + TypeScript.
- **Banco:** PostgreSQL via Prisma (ORM + migrations).
- **Auth:** JWT (stateless) + bcryptjs (hash fator ≥ 10).
- **Observabilidade:** Pino (logs estruturados).

---

## 6. Estrutura de pastas (resumo)

```
backend/src/
  controllers/   AuthController, EventController, AnalyticsController, RecommendationController
  services/      AuthService, EventService(Observer), AnalyticsService, RecommendationService(Strategy)
  repositories/  UserRepository, EventRepository, RegistrationRepository, AnalyticsRepository
  models/        User(Factory), Observer, RecommendationStrategy
  middlewares/   auth (authenticate + requireRole)
  routes/        index.ts (todas as rotas /api)
  utils/         logger (Pino), prisma (singleton)
backend/prisma/  schema.prisma (User, Event, Registration + enums) + migrations
frontend/src/
  pages/         LoginPage, RegisterPage, EventsPage, DashboardPage
  components/     Navbar, Select
  context/        AuthContext (sessão JWT), ThemeContext (dark/light)
  services/       api.ts (Axios + interceptors)
  types/          index.ts
```

---

## 7. Modelo de dados (Prisma)

- **User**: id, name, email (único), password (hash), role (`PARTICIPANT`|`ORGANIZER`).
- **Event**: id, name, description, category (`PALESTRA`|`WORKSHOP`|`MINICURSO`|`SEMINARIO`), date, location, totalSlots, usedSlots, status (`AVAILABLE`|`FULL`|`FINISHED`), organizerId.
- **Registration**: id, status (`CONFIRMED`|`CANCELLED`), userId, eventId. Único por (userId, eventId).

Alterou o schema? Rode `npm run prisma:migrate` e confira que a migration entra no commit.

---

## 8. Estado atual e o que falta

Estado: backend e frontend compilam e rodam; DB e os 3 patterns prontos.

**O trabalho pendente está em `TAREFAS.md` (leia antes de pegar tarefa).** Resumo dos pontos sensíveis:
- RF10.2 — widget de recomendações no frontend (backend já tem endpoint).
- Observabilidade — middleware de log por requisição (segura o bônus + ajuda RNF01).
- Observer — dar lógica real (hoje os `update()` estão vazios).
- RF02 — recuperação de senha: implementar ou remover do escopo (decisão do PO).

---

## 9. Como validar antes de entregar mudança

```bash
# Backend compila?
cd backend && npx tsc --noEmit          # precisa terminar com exit 0

# Frontend compila?
cd frontend && npx tsc --noEmit         # precisa terminar com exit 0
```

Rodar a aplicação:
```bash
# Backend
cd backend && cp .env.example .env   # preencher DATABASE_URL e JWT_SECRET
npm install && npm run prisma:migrate && npm run dev
# Frontend
cd frontend && npm install && npm run dev
```

Se uma mudança quebrar o `tsc` de qualquer um dos lados, ela **não está pronta**.

---

## 10. Convenções de código

- Siga o estilo já existente (TypeScript, sem `any` desnecessário, nomes em inglês).
- Erros de negócio: `throw new Error("mensagem em português")` no Service; o Controller traduz para HTTP.
- Rotas protegidas usam `authenticate` + `requireRole(...)`.
- Não introduza dependências novas sem necessidade clara.
- Commits: mensagem descritiva em português; quando gerado por IA, manter o trailer de co-autoria.

---

## 11. Fluxo esperado de uma IA ao receber uma tarefa

1. Ler este `AGENTS.md` inteiro.
2. Ler `TAREFAS.md` e identificar a tarefa.
3. Ler `README.md` na parte do(s) requisito(s) afetado(s).
4. Localizar a camada certa para a mudança (seção 3).
5. Implementar respeitando arquitetura e patterns.
6. Rodar os type-checks (seção 9).
7. Atualizar `TAREFAS.md` e, se necessário, o `README.md`.
8. Só então propor commit.
