import { Event } from "@prisma/client";
import { EventRepository } from "../repositories/EventRepository";
import logger from "../utils/logger";

// Observer Pattern (DP01)
export interface EventObserver {
  update(event: Event): Promise<void>;
}

/**
 * VacancyObserver — reage à mudança de vagas.
 * Audita (loga) a quantidade de vagas restantes a cada notificação.
 */
export class VacancyObserver implements EventObserver {
  async update(event: Event): Promise<void> {
    const availableSlots = event.totalSlots - event.usedSlots;
    logger.info(
      { eventId: event.id, eventName: event.name, availableSlots },
      "VacancyObserver: vagas atualizadas"
    );
  }
}

/**
 * StatusObserver — dono da regra de transição de status (RF07).
 * Deriva AVAILABLE/FULL a partir de usedSlots/totalSlots e persiste
 * a mudança no banco quando o status precisa mudar. A regra vive aqui,
 * não inline no EventService (Open/Closed — adicionar reações = novo observer).
 */
export class StatusObserver implements EventObserver {
  private eventRepo = new EventRepository();

  async update(event: Event): Promise<void> {
    // Evento encerrado (manual ou por horário) não volta a AVAILABLE/FULL.
    if (event.status === "FINISHED") return;

    const newStatus = event.usedSlots >= event.totalSlots ? "FULL" : "AVAILABLE";

    if (event.status !== newStatus) {
      await this.eventRepo.update(event.id, { status: newStatus });
      logger.info(
        { eventId: event.id, eventName: event.name, from: event.status, to: newStatus },
        "StatusObserver: status do evento atualizado"
      );
    }
  }
}
