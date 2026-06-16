import { Event } from "@prisma/client";
import logger from "../utils/logger";

// Observer Pattern (DP01)
export interface EventObserver {
  update(event: Event): Promise<void>;
}

export class VacancyObserver implements EventObserver {
  async update(event: Event): Promise<void> {
    const availableSlots = event.totalSlots - event.usedSlots;
    logger.info(
      { eventId: event.id, eventName: event.name, availableSlots },
      "VacancyObserver: vagas atualizadas"
    );
  }
}

export class StatusObserver implements EventObserver {
  async update(event: Event): Promise<void> {
    logger.info(
      { eventId: event.id, eventName: event.name, status: event.status },
      "StatusObserver: status do evento atualizado"
    );
  }
}
