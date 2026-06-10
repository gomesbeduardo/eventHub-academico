import { AnalyticsRepository } from "../repositories/AnalyticsRepository";

export class AnalyticsService {
  private repo = new AnalyticsRepository();

  async getMetrics(organizerId: string) {
    const [occupancy, categoryDistribution] = await Promise.all([
      this.repo.getOccupancyRates(organizerId),
      this.repo.getCategoryDistribution(organizerId),
    ]);

    return {
      occupancy: occupancy.map((r) => ({
        id: r.id,
        name: r.name,
        totalSlots: r.total_slots,
        confirmed: Number(r.confirmed),
        occupancyPct: Number(r.occupancy_pct),
      })),
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    };
  }

  async getTrends(organizerId: string) {
    const rows = await this.repo.getRegistrationTrend(organizerId);
    return rows.map((r) => ({
      week: r.week,
      registrations: Number(r.registrations),
    }));
  }

  async getRanking(organizerId: string) {
    const rows = await this.repo.getOccupancyRates(organizerId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      totalSlots: r.total_slots,
      confirmed: Number(r.confirmed),
      occupancyPct: Number(r.occupancy_pct),
    }));
  }
}
