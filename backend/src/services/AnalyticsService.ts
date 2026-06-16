import { AnalyticsRepository, AnalyticsFilters } from "../repositories/AnalyticsRepository";

export class AnalyticsService {
  private repo = new AnalyticsRepository();

  async getMetrics(filters: AnalyticsFilters = {}) {
    const [occupancy, categoryDistribution] = await Promise.all([
      this.repo.getOccupancyRates(filters),
      this.repo.getCategoryDistribution(filters),
    ]);

    return {
      occupancy: occupancy.map((r) => ({
        id: r.id,
        name: r.name,
        organizerName: r.organizer_name,
        totalSlots: r.total_slots,
        confirmed: Number(r.confirmed),
        occupancyPct: Number(r.occupancy_pct ?? 0),
      })),
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    };
  }

  async getTrends(filters: AnalyticsFilters = {}) {
    const rows = await this.repo.getRegistrationTrend(filters);
    return rows.map((r) => ({
      week: r.week,
      registrations: Number(r.registrations),
    }));
  }

  async getRanking(filters: AnalyticsFilters = {}) {
    const rows = await this.repo.getOccupancyRates(filters);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      organizerName: r.organizer_name,
      totalSlots: r.total_slots,
      confirmed: Number(r.confirmed),
      occupancyPct: Number(r.occupancy_pct ?? 0),
    }));
  }

  async getOrganizers() {
    return this.repo.getOrganizers();
  }
}
