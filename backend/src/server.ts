import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes";
import logger from "./utils/logger";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/api", router);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

export default app;
