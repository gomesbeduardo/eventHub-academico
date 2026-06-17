import { EventCategory, EventStatus } from "@prisma/client";
import { EventRepository } from "../repositories/EventRepository";
import { RegistrationRepository } from "../repositories/RegistrationRepository";
import { EventObserver, VacancyObserver, StatusObserver } from "../models/Observer";
import logger from "../utils/logger";

// RF03 — categorias válidas vêm direto do enum do Prisma
// (PALESTRA, WORKSHOP, MINICURSO, SEMINARIO). Sem lista hard-coded duplicada.
const VALID_CATEGORIES = Object.values(EventCategory) as EventCategory[];

function assertValidCategory(category: unknown): asserts category is EventCategory {
  if (!VALID_CATEGORIES.includes(category as EventCategory)) {
    throw new Error(
      `Categoria inválida. Use uma de: ${VALID_CATEGORIES.join(", ")}`
    );
  }
}

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
    // RF03 — categoria obrigatória e dentro da lista pré-definida
    assertValidCategory(data.category);

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
    // RF07 — encerra por horário antes de listar: a lista sempre reflete
    // eventos vencidos como FINISHED, sem depender só do scheduler.
    await this.closeExpiredEvents();
    return this.eventRepo.findAll(filters);
  }

  async getOrganizerEvents(organizerId: string) {
    await this.closeExpiredEvents();
    return this.eventRepo.findByOrganizer(organizerId);
  }

  /**
   * Encerramento manual (organizador). Bloqueia novas inscrições e tira o
   * evento da lista de disponíveis. Só o dono encerra.
   */
  async closeEvent(eventId: string, organizerId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.organizerId !== organizerId) throw new Error("Sem permissão");
    if (event.status === "FINISHED") throw new Error("Evento já está encerrado");

    return this.eventRepo.update(eventId, { status: "FINISHED" });
  }

  /**
   * Encerramento automático por horário (RF07). Marca como FINISHED todo
   * evento cuja data já passou. Chamado pelo scheduler do server e antes
   * de cada listagem. Idempotente.
   */
  async closeExpiredEvents(): Promise<number> {
    const count = await this.eventRepo.markFinishedPastEvents(new Date());
    if (count > 0) {
      logger.info({ count }, "Eventos encerrados automaticamente por horário");
    }
    return count;
  }

  async updateEvent(
    eventId: string,
    organizerId: string,
    // RF03 — agora a categoria também pode ser editada (CRUD com categoria)
    data: Partial<{
      name: string;
      description: string;
      category: EventCategory;
      date: Date;
      location: string;
      totalSlots: number;
    }>
  ) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.organizerId !== organizerId) throw new Error("Sem permissão");

    // RF03 — se vier categoria nova, valida antes de persistir
    if (data.category !== undefined) {
      assertValidCategory(data.category);
    }

    // RF03 — se a data for editada, ela também não pode ser no passado
    if (data.date !== undefined && new Date(data.date) < new Date()) {
      throw new Error("A data do evento deve ser igual ou posterior à data atual");
    }

    return this.eventRepo.update(eventId, data);
  }

  async deleteEvent(eventId: string, organizerId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.organizerId !== organizerId) throw new Error("Sem permissão");

    const activeRegs = await this.registrationRepo.countConfirmedByEvent(eventId);
    if (activeRegs > 0) {
      throw new Error(
        `Este evento possui ${activeRegs} inscrição(ões) ativa(s). Cancele as inscrições antes de excluir.`
      );
    }

    await this.eventRepo.delete(eventId);
  }

  async registerParticipant(eventId: string, userId: string) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Evento não encontrado");
    if (event.status === "FINISHED" || new Date(event.date) < new Date()) {
      throw new Error("Evento encerrado");
    }
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

    // Atualiza só o contador de vagas. A transição de status (AVAILABLE/FULL)
    // é responsabilidade do StatusObserver, disparado por notify() (DP01).
    const newUsedSlots = event.usedSlots + 1;
    await this.eventRepo.update(eventId, { usedSlots: newUsedSlots });

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

    // Libera a vaga (contador). O StatusObserver reavalia e reabre o evento
    // (FULL → AVAILABLE) via notify() quando passa a haver vaga (DP01).
    const newUsedSlots = Math.max(0, event.usedSlots - 1);
    await this.eventRepo.update(eventId, { usedSlots: newUsedSlots });

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