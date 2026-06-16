# Justificativas de Arquitetura e Escolhas Técnicas

Documento de apoio para a apresentação e o relatório final do EventHub Acadêmico.

---

## 1. Por que Arquitetura em Camadas (+ MVC)

### A decisão

Adotamos a **Arquitetura em Camadas** (Layered Architecture), com o backend organizado
segundo o padrão **MVC**. O fluxo de uma requisição é sempre unidirecional:

```
Frontend → Controller → Service → Repository → Banco de Dados
```

Cada camada conhece apenas a camada imediatamente abaixo. Nenhuma camada "pula" outra.

### Por que essa e não outra

| Alternativa | Por que descartamos |
|-------------|---------------------|
| **Tudo em um arquivo / sem camadas** | Regra de negócio, acesso a banco e tratamento HTTP misturados. Impossível testar ou manter. |
| **Cliente-Servidor "puro" (sem separar o servidor internamente)** | Resolve a comunicação front/back, mas não organiza o backend por dentro. Continuaríamos com lógica espalhada. |
| **Microsserviços** | Excesso de complexidade (deploy, rede, orquestração) para um projeto acadêmico com um time de 3. Não se justifica. |
| **Camadas (escolhida)** | Separa responsabilidades, isola a regra de negócio, permite trocar peças (ex.: banco) sem reescrever o resto. Equilíbrio certo de organização x esforço. |

### O papel de cada camada

| Camada | Responsabilidade | O que **não** pode fazer |
|--------|------------------|--------------------------|
| **Apresentação** (React) | Renderizar telas, capturar input, chamar a API | Conter regra de negócio |
| **Controller** (Express) | Receber a requisição HTTP, validar formato, delegar, devolver resposta | Conter regra de negócio ou acessar o banco direto |
| **Service** | **Toda** a regra de negócio (validações de domínio, controle de vagas, recomendações, BI) | Lidar com `req`/`res` ou montar SQL |
| **Repository** (Prisma) | Acesso a dados: consultas e gravações | Conter regra de negócio |
| **Banco** (PostgreSQL) | Persistência | — |

### Benefícios concretos no projeto (liga com os requisitos)

- **Manutenibilidade (RNF05):** a regra de negócio vive só nos Services. As pastas
  `/controllers`, `/services`, `/repositories`, `/models` tornam o critério verificável.
- **Testabilidade:** um Service pode ser testado sem subir o servidor HTTP nem o banco.
- **Baixo acoplamento:** trocar PostgreSQL por outro banco mexe só na camada Repository.
- **Divisão de trabalho:** com a fronteira clara entre camadas, dois devs trabalham em
  paralelo (um no Service, outro no Controller/Front) sem colidir.
- **Onde os Design Patterns encaixam:** Observer e Strategy vivem na camada de Service,
  Factory Method na camada de Models — exatamente onde a regra de negócio mora.

---

## 2. Justificativa das Escolhas Técnicas

> Em cada escolha: **o que resolve** e **qual requisito sustenta**.

### Backend

| Tecnologia | Por que escolhemos | Liga com |
|-----------|--------------------|----------|
| **Node.js + Express** | Leve, rápido de configurar, padrão de mercado para APIs REST. Curva de aprendizado baixa para o time. | Toda a Camada Controller |
| **TypeScript** | Tipagem estática pega erro em tempo de compilação, não em produção. Auto-completar acelera o desenvolvimento. | Confiabilidade (RNF04), Manutenibilidade (RNF05) |
| **PostgreSQL** | Banco relacional robusto. O módulo de BI depende de agregações (`GROUP BY`, `COUNT`, ranking) que o SQL faz nativamente e bem. | RF09 (BI), **bônus DB** |
| **Prisma (ORM)** | Abstrai o SQL para o CRUD comum, gera tipos TypeScript automáticos a partir do schema e gerencia migrations versionadas. Onde precisamos de agregação fina, usamos `$queryRaw`. | RF03–RF08, migrations, **bônus DB** |
| **JWT** | Autenticação *stateless*: o servidor não guarda sessão, o token carrega a identidade. Integra fácil com React (header `Authorization`) e Express (middleware). | RF02, RNF02 |
| **bcrypt (fator ≥ 10)** | Hash de senha com *salt* embutido e custo configurável. Padrão da indústria contra vazamento de credenciais. | RNF02 (Segurança) |
| **Pino** | Logger de baixo overhead, saída em JSON estruturado. Usado no middleware de log por requisição (método, rota, status, latência). | Observabilidade (**bônus**), Desempenho (RNF01) |

### Frontend

| Tecnologia | Por que escolhemos | Liga com |
|-----------|--------------------|----------|
| **React + Vite** | Componentes reativos e reutilizáveis; Vite dá *dev server* rápido com hot-reload. | RF06, RF09, RF10 |
| **TypeScript** | Mesmos tipos compartilhados com a lógica do front; menos bug de integração com a API. | Manutenibilidade |
| **React Router** | Navegação SPA com rotas protegidas por autenticação (participante x organizador). | RF02, controle de acesso |
| **Recharts** | Biblioteca de gráficos nativa do React (barras, pizza, linha). Evita reinventar visualização para o dashboard de BI. | RF09 |
| **Axios** | Cliente HTTP com *interceptors* — injeta o token JWT em toda requisição automaticamente. | RF02, RNF02 |

### Observabilidade (bônus) — por que "do jeito certo"

Não basta ter `console.log`. Implementamos:
- **`requestLogger`**: uma linha estruturada por requisição (método, rota, status, latência em ms).
- **`errorLogger`**: middleware de erro no fim da cadeia, registra mensagem e stack.
- **`/metrics`**: endpoint com total de requisições, tempo médio de resposta e contagem por status.

Isso dá visibilidade real do sistema em execução e ainda **comprova o RNF01** (resposta < 2s),
porque a latência de cada rota fica medida e exposta.

---

## 3. Resumo de uma frase (para a banca)

> "Escolhemos **Arquitetura em Camadas com MVC** porque isola a regra de negócio na camada de
> Service, deixa o código testável e manutenível (RNF05) e dá lugar natural para os Design
> Patterns. A stack (**Node/Express, PostgreSQL/Prisma, JWT/bcrypt, React/Recharts, Pino**) foi
> escolhida para sustentar diretamente os requisitos: BI sobre SQL relacional, segurança por
> hash e token, e observabilidade medível."
