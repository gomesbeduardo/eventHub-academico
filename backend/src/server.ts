import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes";
import logger from "./utils/logger";
import { requestLogger, errorLogger, getMetrics } from "./middlewares/requestLogger";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

// Observabilidade — loga toda requisição (método, rota, status, latência)
app.use(requestLogger);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/metrics", (_req, res) => res.json(getMetrics()));

app.use("/api", router);

// Middleware de erro no fim da cadeia — loga stack/mensagem
app.use(errorLogger);

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

export default app;