# EventHub Acadêmico — Tarefas Pendentes

> Documento de distribuição de atividades. Base: análise do repositório em 15/06/2026.
> Estado atual: backend compila e roda, frontend compila e roda, PostgreSQL + Prisma OK, 3 Design Patterns presentes.
> Foco desta rodada: fechar os requisitos prometidos no README que ainda não estão implementados + garantir o ponto extra de observabilidade.

---

## Resumo do que falta (visão rápida)

| Prioridade | Item | Responsável sugerido |
|-----------|------|----------------------|
| 🔴 Alta | RF10.2 — Widget de recomendações no frontend | Dev 2 |
| 🔴 Alta | Observabilidade — middleware de log de requisições (BÔNUS) | Dev 1 |
| 🟠 Média | Observer com lógica real (não só casca) | Dev 2 |
| 🟠 Média | RF02 — Recuperação de senha por e-mail **OU** remover do escopo | Dev 1 |
| 🟢 Baixa | Preencher nomes da equipe no README | PO |
| 🟢 Baixa | Documento de Requisitos no template da aula (doc separado) | PO |

Regra do enunciado: **todo requisito declarado tem que estar implementado.** Se não der pra implementar, tem que sair do README. Não pode ficar prometido e faltando.

---

## 🔴 Tarefa 1 — RF10.2: Widget de Recomendações (Frontend)

**Quem:** Dev 2
**Problema:** O backend já tem o endpoint `GET /api/recommendations/:participantId` funcionando (Strategy DP03). O frontend não consome nada disso — não existe UI nem chamada na API client.

**O que fazer:**
1. Em `frontend/src/services/api.ts`: adicionar método `getRecommendations(participantId)` que chama `GET /api/recommendations/:participantId`.
2. Em `frontend/src/types/index.ts`: garantir tipo `Event` (ou reusar o existente) para a resposta.
3. Na `EventsPage.tsx` (área do Participante): renderizar uma seção "Recomendados pra você" com cards (nome, categoria, data, vagas).
4. Atender o RF10 do README:
   - Mínimo de 3 recomendações exibidas quando houver.
   - Não recomendar eventos em que já está inscrito (backend já filtra — só exibir).
   - Só eventos com vaga e data futura (backend já filtra).

**Pronto quando:** Participante logado vê os cards de recomendação na tela, vindos do endpoint real.

---

## 🔴 Tarefa 2 — Observabilidade: Middleware de Log (BÔNUS)

**Quem:** Dev 1
**Problema:** O Pino está instalado mas só loga no boot do servidor (`logger.info("Server running...")`). Para o ponto extra, o enunciado exige observabilidade "de forma correta". Hoje está fraco demais. Bônus = DB **+** observabilidade, os dois juntos. O DB já está OK; falta segurar a observabilidade.

**O que fazer:**
1. Criar `backend/src/middlewares/requestLogger.ts`: middleware Express que loga cada requisição com método, rota, status code e latência (ms).
2. Registrar no `server.ts` antes do `app.use("/api", router)`.
3. Logar erros também: middleware de erro no fim da cadeia, logando stack/mensagem via `logger.error`.
4. (Opcional, fortalece) Endpoint `/metrics` simples: contador de requisições e tempo médio de resposta.

**Por que importa:** Isso também ajuda a comprovar o RNF01 (resposta < 2s), porque o log mostra a latência real de cada rota na demonstração.

**Pronto quando:** Ao usar o app, o terminal do backend mostra uma linha por requisição com latência, e erros aparecem logados.

---

## 🟠 Tarefa 3 — Observer com lógica real (DP01)

**Quem:** Dev 2
**Problema:** `backend/src/models/Observer.ts` tem `VacancyObserver` e `StatusObserver`, mas os métodos `update()` estão vazios (só comentário). O padrão está cabeado no `EventService`, mas não faz nada — a lógica de vagas/status está inline no service. Na avaliação, o professor pode notar que o padrão é decorativo.

**O que fazer:**
1. Mover a regra de atualização de status (AVAILABLE/FULL conforme `usedSlots`) de dentro do `EventService.registerParticipant`/`cancelRegistration` para o `StatusObserver.update()`.
2. `VacancyObserver.update()`: pode logar a mudança de vagas (e amarra com a Tarefa 2 — usar o `logger`).
3. Garantir que `notify()` continua sendo chamado após inscrição e cancelamento.

**Pronto quando:** A mudança de status do evento acontece dentro de um Observer, não inline no service. Comportamento final igual ao de hoje, mas o padrão passa a ter substância.

---

## 🟠 Tarefa 4 — RF02: Recuperação de senha (decisão)

**Quem:** Dev 1 + decisão do PO
**Problema:** O README (RF02) promete "recuperação de senha via link por e-mail". Não existe código pra isso.

**Duas saídas — PO escolhe:**
- **A) Implementar (mais trabalho):** endpoint `POST /api/auth/forgot-password` gera token temporário; `POST /api/auth/reset-password` troca a senha. Envio de e-mail pode ser simulado (logar o link no console em vez de SMTP real) — suficiente pra demonstrar.
- **B) Remover do escopo (rápido):** tirar a linha de recuperação de senha do RF02 no README. O enunciado não exige essa feature específica; exige que o que está escrito esteja implementado.

**Recomendação:** se o tempo estiver curto, opção B. Se sobrar fôlego, opção A com e-mail simulado.

**Obs. relacionada (não bloqueia nota):** "logout invalida o token" — JWT é stateless, o logout atual só limpa o frontend. Está OK para o trabalho; só explicar isso na apresentação se perguntarem.

---

## 🟢 Tarefa 5 — README: nomes da equipe

**Quem:** PO
A tabela de Equipe está com nomes em branco (`—`). Preencher os 3 integrantes reais (PO + Dev 1 + Dev 2) com nome e papel. Equipe de 3 é permitida.

---

## 🟢 Tarefa 6 — Documento de Requisitos (template da aula)

**Quem:** PO
O enunciado pede o "Documento de Requisitos no template mostrado em aula". O README cobre o conteúdo (RF/RNF), mas não é o template formal. Produzir um documento separado seguindo o modelo da disciplina, reaproveitando os RFs/RNFs que já estão no README.

---

## Checklist final antes da apresentação

- [ ] App compila e roda (backend + frontend) — já OK, revalidar
- [ ] Todos os RFs do README demonstráveis na tela
- [ ] Nenhum requisito prometido sem implementação
- [ ] DB PostgreSQL funcionando com dados de exemplo (seed para a demo)
- [ ] Observabilidade visível (logs de requisição no terminal durante a demo)
- [ ] 3 Design Patterns explicáveis: o que resolve, onde, por quê
- [ ] Equipe e responsáveis preenchidos
- [ ] Documento de Requisitos no template entregue
