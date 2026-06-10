import { Response } from "express";
import { AnalyticsService } from "../services/AnalyticsService";
import { AuthRequest } from "../middlewares/auth";

const analyticsService = new AnalyticsService();

export const AnalyticsController = {
  async metrics(req: AuthRequest, res: Response) {
    try {
      const organizerId = req.params.organizerId;
      if (req.user!.id !== organizerId) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }
      const data = await analyticsService.getMetrics(organizerId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async trends(req: AuthRequest, res: Response) {
    try {
      const organizerId = req.params.organizerId;
      if (req.user!.id !== organizerId) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }
      const data = await analyticsService.getTrends(organizerId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async ranking(req: AuthRequest, res: Response) {
    try {
      const organizerId = req.params.organizerId;
      if (req.user!.id !== organizerId) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }
      const data = await analyticsService.getRanking(organizerId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
