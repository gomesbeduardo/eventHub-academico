import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

/**
 * Observabilidade (BÔNUS) — Tarefa 2.
 *
 * - `requestLogger`: loga uma linha por requisição (método, rota, status, latência).
 * - `errorLogger`: middleware de erro no fim da cadeia, loga stack/mensagem.
 * - `getMetrics`: snapshot simples para o endpoint /metrics (RNF01 — comprova < 2s).
 */

interface MetricsState {
  totalRequests: number;
  totalDurationMs: number;
  statusCounts: Record<number, number>;
}

const metrics: MetricsState = {
  totalRequests: 0,
  totalDurationMs: 0,
  statusCounts: {},
};

export function getMetrics() {
  const avg =
    metrics.totalRequests > 0 ? metrics.totalDurationMs / metrics.totalRequests : 0;

  return {
    totalRequests: metrics.totalRequests,
    avgResponseTimeMs: Number(avg.toFixed(2)),
    statusCounts: metrics.statusCounts,
  };
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    metrics.totalRequests += 1;
    metrics.totalDurationMs += durationMs;
    metrics.statusCounts[res.statusCode] =
      (metrics.statusCounts[res.statusCode] ?? 0) + 1;

    const entry = {
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    };

    if (res.statusCode >= 500) logger.error(entry, "request");
    else if (res.statusCode >= 400) logger.warn(entry, "request");
    else logger.info(entry, "request");
  });

  next();
}

export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(
    {
      method: req.method,
      route: req.originalUrl,
      message: err.message,
      stack: err.stack,
    },
    "unhandled error"
  );

  if (res.headersSent) return;
  res.status(500).json({ error: "Erro interno do servidor" });
}