import { Response } from "express";
import { EventCategory } from "@prisma/client";
import { AnalyticsService } from "../services/AnalyticsService";
import { AnalyticsFilters } from "../repositories/AnalyticsRepository";
import { AuthRequest } from "../middlewares/auth";

const analyticsService = new AnalyticsService();

const VALID_CATEGORIES = ["PALESTRA", "WORKSHOP", "MINICURSO", "SEMINARIO"];

// Extrai filtros opcionais (organizerId, category) da query string.
function parseFilters(req: AuthRequest): AnalyticsFilters {
  const filters: AnalyticsFilters = {};
  const organizerId = req.query.organizerId;
  const category = req.query.category;
  if (typeof organizerId === "string" && organizerId) filters.organizerId = organizerId;
  if (typeof category === "string" && VALID_CATEGORIES.includes(category)) {
    filters.category = category as EventCategory;
  }
  return filters;
}

export const AnalyticsController = {
  async metrics(req: AuthRequest, res: Response) {
    try {
      const data = await analyticsService.getMetrics(parseFilters(req));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async trends(req: AuthRequest, res: Response) {
    try {
      const data = await analyticsService.getTrends(parseFilters(req));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async ranking(req: AuthRequest, res: Response) {
    try {
      const data = await analyticsService.getRanking(parseFilters(req));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async organizers(_req: AuthRequest, res: Response) {
    try {
      const data = await analyticsService.getOrganizers();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
