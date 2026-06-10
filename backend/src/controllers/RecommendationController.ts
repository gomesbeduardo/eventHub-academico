import { Response } from "express";
import { RecommendationService } from "../services/RecommendationService";
import { AuthRequest } from "../middlewares/auth";

const recommendationService = new RecommendationService();

export const RecommendationController = {
  async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const participantId = req.params.participantId;
      if (req.user!.id !== participantId) {
        res.status(403).json({ error: "Acesso negado" });
        return;
      }
      const events = await recommendationService.getRecommendations(participantId);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
