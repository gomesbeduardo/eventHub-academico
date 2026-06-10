import { Response } from "express";
import { EventService } from "../services/EventService";
import { AuthRequest } from "../middlewares/auth";

const eventService = new EventService();

export const EventController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, category, date, location, totalSlots } = req.body;
      const event = await eventService.createEvent({
        name, description, category,
        date: new Date(date),
        location,
        totalSlots: Number(totalSlots),
        organizerId: req.user!.id,
      });
      res.status(201).json(event);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      const { category, status, dateFrom } = req.query as Record<string, string>;
      const events = await eventService.listEvents({
        category: category as any,
        status: status as any,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      });
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async myEvents(req: AuthRequest, res: Response) {
    try {
      const events = await eventService.getOrganizerEvents(req.user!.id);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const event = await eventService.updateEvent(req.params.id, req.user!.id, req.body);
      res.json(event);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      await eventService.deleteEvent(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async register(req: AuthRequest, res: Response) {
    try {
      const reg = await eventService.registerParticipant(req.params.id, req.user!.id);
      res.status(201).json(reg);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async cancel(req: AuthRequest, res: Response) {
    try {
      await eventService.cancelRegistration(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async registrations(req: AuthRequest, res: Response) {
    try {
      const list = await eventService.getEventRegistrations(req.params.id, req.user!.id);
      res.json(list);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async history(req: AuthRequest, res: Response) {
    try {
      const history = await eventService.getUserHistory(req.user!.id);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};
