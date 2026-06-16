import { Prisma, EventCategory } from "@prisma/client";
import prisma from "../utils/prisma";

export interface AnalyticsFilters {
  organizerId?: string;
  category?: EventCategory;
}

export class AnalyticsRepository {
  // Monta o WHERE dinâmico para os eventos a partir dos filtros opcionais.
  private buildEventWhere(filters: AnalyticsFilters) {
    const conds: Prisma.Sql[] = [];
    if (filters.organizerId) conds.push(Prisma.sql`e."organizerId" = ${filters.organizerId}`);
    if (filters.category) conds.push(Prisma.sql`e.category::text = ${filters.category}`);
    return conds.length ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}` : Prisma.empty;
  }

  async getOccupancyRates(filters: AnalyticsFilters = {}) {
    const where = this.buildEventWhere(filters);
    return prisma.$queryRaw<
      {
        id: string;
        name: string;
        total_slots: number;
        confirmed: bigint;
        occupancy_pct: number;
        organizer_name: string;
      }[]
    >`
      SELECT
        e.id,
        e.name,
        e."totalSlots"   AS total_slots,
        COUNT(r.id)      AS confirmed,
        ROUND(COUNT(r.id)::decimal / NULLIF(e."totalSlots", 0) * 100, 1) AS occupancy_pct,
        u.name           AS organizer_name
      FROM events e
      JOIN users u ON u.id = e."organizerId"
      LEFT JOIN registrations r
        ON r."eventId" = e.id AND r.status = 'CONFIRMED'
      ${where}
      GROUP BY e.id, e.name, e."totalSlots", u.name
      ORDER BY occupancy_pct DESC NULLS LAST
    `;
  }

  async getCategoryDistribution(filters: AnalyticsFilters = {}) {
    return prisma.event.groupBy({
      by: ["category"],
      where: {
        ...(filters.organizerId ? { organizerId: filters.organizerId } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
      _count: { id: true },
    });
  }

  async getRegistrationTrend(filters: AnalyticsFilters = {}) {
    const conds: Prisma.Sql[] = [Prisma.sql`r.status = 'CONFIRMED'`];
    if (filters.organizerId) conds.push(Prisma.sql`e."organizerId" = ${filters.organizerId}`);
    if (filters.category) conds.push(Prisma.sql`e.category::text = ${filters.category}`);
    const where = Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`;
    return prisma.$queryRaw<{ week: Date; registrations: bigint }[]>`
      SELECT
        DATE_TRUNC('week', r."createdAt") AS week,
        COUNT(r.id)                        AS registrations
      FROM registrations r
      JOIN events e ON r."eventId" = e.id
      ${where}
      GROUP BY week
      ORDER BY week ASC
    `;
  }

  // Lista de organizadores para popular o filtro do dashboard.
  async getOrganizers() {
    return prisma.user.findMany({
      where: { role: "ORGANIZER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}
