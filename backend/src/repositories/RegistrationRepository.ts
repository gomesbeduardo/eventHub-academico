import { Registration, RegistrationStatus } from "@prisma/client";
import prisma from "../utils/prisma";

export class RegistrationRepository {
  async create(data: { userId: string; eventId: string }): Promise<Registration> {
    return prisma.registration.create({ data });
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<Registration | null> {
    return prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
  }

  async findByUser(userId: string) {
    return prisma.registration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { event: { date: "desc" } },
    });
  }

  async findByEvent(eventId: string) {
    return prisma.registration.findMany({
      where: { eventId, status: "CONFIRMED" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    return prisma.registration.update({ where: { id }, data: { status } });
  }

  async countByUser(userId: string): Promise<number> {
    return prisma.registration.count({
      where: { userId, status: "CONFIRMED" },
    });
  }

  async countConfirmedByEvent(eventId: string): Promise<number> {
    return prisma.registration.count({
      where: { eventId, status: "CONFIRMED" },
    });
  }
}
