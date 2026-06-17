import { Event, EventCategory, EventStatus } from "@prisma/client";
import prisma from "../utils/prisma";

export class EventRepository {
  async create(data: {
    name: string;
    description: string;
    category: EventCategory;
    date: Date;
    location: string;
    totalSlots: number;
    organizerId: string;
  }): Promise<Event> {
    return prisma.event.create({ data });
  }

  async findAll(filters?: {
    category?: EventCategory;
    status?: EventStatus;
    dateFrom?: Date;
  }): Promise<Event[]> {
    return prisma.event.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.dateFrom && { date: { gte: filters.dateFrom } }),
      },
      orderBy: { date: "asc" },
    });
  }

  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({ where: { id } });
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    return prisma.event.findMany({
      where: { organizerId },
      orderBy: { date: "desc" },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      category: EventCategory;
      date: Date;
      location: string;
      totalSlots: number;
      usedSlots: number;
      status: EventStatus;
    }>
  ): Promise<Event> {
    return prisma.event.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.event.delete({ where: { id } });
  }

  /**
   * Fecha em lote os eventos cuja data já passou e que ainda não estão
   * encerrados. Usado pelo encerramento automático por horário.
   */
  async markFinishedPastEvents(now: Date): Promise<number> {
    const result = await prisma.event.updateMany({
      where: { date: { lt: now }, status: { not: "FINISHED" } },
      data: { status: "FINISHED" },
    });
    return result.count;
  }
}
