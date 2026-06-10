import prisma from "../utils/prisma";

export class AnalyticsRepository {
  async getOccupancyRates(organizerId: string) {
    return prisma.$queryRaw<
      { id: string; name: string; total_slots: number; confirmed: bigint; occupancy_pct: number }[]
    >`
      SELECT
        e.id,
        e.name,
        e."totalSlots"   AS total_slots,
        COUNT(r.id)      AS confirmed,
        ROUND(COUNT(r.id)::decimal / e."totalSlots" * 100, 1) AS occupancy_pct
      FROM events e
      LEFT JOIN registrations r
        ON r."eventId" = e.id AND r.status = 'CONFIRMED'
      WHERE e."organizerId" = ${organizerId}
      GROUP BY e.id, e.name, e."totalSlots"
      ORDER BY occupancy_pct DESC
    `;
  }

  async getCategoryDistribution(organizerId: string) {
    return prisma.event.groupBy({
      by: ["category"],
      where: { organizerId },
      _count: { id: true },
    });
  }

  async getRegistrationTrend(organizerId: string) {
    return prisma.$queryRaw<{ week: Date; registrations: bigint }[]>`
      SELECT
        DATE_TRUNC('week', r."createdAt") AS week,
        COUNT(r.id)                        AS registrations
      FROM registrations r
      JOIN events e ON r."eventId" = e.id
      WHERE e."organizerId" = ${organizerId}
        AND r.status = 'CONFIRMED'
      GROUP BY week
      ORDER BY week ASC
    `;
  }
}
