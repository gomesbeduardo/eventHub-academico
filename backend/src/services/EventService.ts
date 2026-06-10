import { EventCategory, EventStatus } from "@prisma/client";
import { EventRepository } from "../repositories/EventRepository";
import { RegistrationRepository } from "../repositories/RegistrationRepository";
import { EventObserver, VacancyObserver, StatusObserver } from "../models/Observer";

// Observer Pattern (DP01) — EventService notifies observers on slot changes
export class EventService {
  private eventRepo = new EventRepository();
  private registrationRepo = new RegistrationRepository();
  private observers: EventObserver[] = [new VacancyObserver(), new StatusObserver()];

  subscribe(observer: EventObserver) {
    this.observers.push(observer);
  }

  private async notify(eventId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (event) {
      await Promise.all(this.observers.map((o) => o.update(event)));
    }
  }

  async createEvent(data: {
    name: string;
    description: string;
    category: EventCategory;
    date: Date;
    location: string;
    totalSlots: number;
    organizerId: string;
  }) {
    if (new Date(data.date) < new Date()) {
      throw new Error("A data do evento deve ser igual ou posterior à data atual");
    }
    return this.eventRepo.create(data);
  }

  async listEvents(filters?: {
    category?: EventCategory;
    status?: EventStatus;
    dateFrom?: Date;
  }) {
    return this.eventRepo.findAll(filters);
  }

  async getOrganizerEvents(organizerId: string) {
    return this.eventRepo.findByOrganizer(organizerId);
  }

  async updateEvent(
    eventId: string,
    organizerId: string,
    data: Partial<{ name: string; description: string; date: Date; location: string; totalSlots: number }>
  ) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.organizerId !== organizerId) throw new Error("Sem permissão");

    return this.eventRepo.update(eventId, data);
  }

  async deleteEvent(eventId: string, organizerId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.organizerId !== organizerId) throw new Error("Sem permissão");

    await this.eventRepo.delete(eventId);
  }

  async registerParticipant(eventId: string, userId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.status === "FULL") throw new Error("Evento lotado");

    const existing = await this.registrationRepo.findByUserAndEvent(userId, eventId);
    if (existing && existing.status === "CONFIRMED") {
      throw new Error("Participante já inscrito neste evento");
    }

    let registration;
    if (existing) {
      registration = await this.registrationRepo.updateStatus(existing.id, "CONFIRMED");
    } else {
      registration = await this.registrationRepo.create({ userId, eventId });
    }

    const newUsedSlots = event.usedSlots + 1;
    const newStatus: EventStatus = newUsedSlots >= event.totalSlots ? "FULL" : "AVAILABLE";
    await this.eventRepo.update(eventId, { usedSlots: newUsedSlots, status: newStatus });

    await this.notify(eventId);
    return registration;
  }

  async cancelRegistration(eventId: string, userId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (new Date(event.date) < new Date()) {
      throw new Error("Não é possível cancelar inscrição em evento já realizado");
    }

    const registration = await this.registrationRepo.findByUserAndEvent(userId, eventId);
    if (!registration || registration.status === "CANCELLED") {
      throw new Error("Inscrição não encontrada");
    }

    await this.registrationRepo.updateStatus(registration.id, "CANCELLED");

    const newUsedSlots = Math.max(0, event.usedSlots - 1);
    await this.eventRepo.update(eventId, { usedSlots: newUsedSlots, status: "AVAILABLE" });

    await this.notify(eventId);
  }

  async getEventRegistrations(eventId: string, organizerId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.organizerId !== organizerId) throw new Error("Sem permissão");

    return this.registrationRepo.findByEvent(eventId);
  }

  async getUserHistory(userId: string) {
    return this.registrationRepo.findByUser(userId);
  }
}
