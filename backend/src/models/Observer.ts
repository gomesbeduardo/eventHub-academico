import { Event } from "@prisma/client";

// Observer Pattern (DP01)
export interface EventObserver {
  update(event: Event): Promise<void>;
}

export class VacancyObserver implements EventObserver {
  async update(event: Event): Promise<void> {
    // Triggered after slot changes — downstream handlers (e.g. notifications) hook here
  }
}

export class StatusObserver implements EventObserver {
  async update(event: Event): Promise<void> {
    // Triggered to reflect updated status in API responses / caches
  }
}
