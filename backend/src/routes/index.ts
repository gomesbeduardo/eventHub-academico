import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { EventController } from "../controllers/EventController";
import { AnalyticsController } from "../controllers/AnalyticsController";
import { RecommendationController } from "../controllers/RecommendationController";
import { authenticate, requireRole } from "../middlewares/auth";

const router = Router();

// Auth
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

// Events — public listing
router.get("/events", authenticate, EventController.list);

// Events — organizer
router.post("/events", authenticate, requireRole("ORGANIZER"), EventController.create);
router.get("/events/mine", authenticate, requireRole("ORGANIZER"), EventController.myEvents);
router.put("/events/:id", authenticate, requireRole("ORGANIZER"), EventController.update);
router.delete("/events/:id", authenticate, requireRole("ORGANIZER"), EventController.remove);
router.get("/events/:id/registrations", authenticate, requireRole("ORGANIZER"), EventController.registrations);

// Registrations — participant
router.post("/events/:id/register", authenticate, requireRole("PARTICIPANT"), EventController.register);
router.delete("/events/:id/register", authenticate, requireRole("PARTICIPANT"), EventController.cancel);
router.get("/registrations/history", authenticate, requireRole("PARTICIPANT"), EventController.history);

// Analytics — organizer
router.get("/analytics/:organizerId/metrics", authenticate, requireRole("ORGANIZER"), AnalyticsController.metrics);
router.get("/analytics/:organizerId/trends", authenticate, requireRole("ORGANIZER"), AnalyticsController.trends);
router.get("/analytics/:organizerId/ranking", authenticate, requireRole("ORGANIZER"), AnalyticsController.ranking);

// Recommendations — participant
router.get("/recommendations/:participantId", authenticate, requireRole("PARTICIPANT"), RecommendationController.getRecommendations);

export default router;
