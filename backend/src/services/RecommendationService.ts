import { Event } from "@prisma/client";
import { RecommendationStrategy } from "../models/RecommendationStrategy";
import { RegistrationRepository } from "../repositories/RegistrationRepository";
import prisma from "../utils/prisma";

// Strategy Pattern (DP03)
class ContentBasedStrategy implements RecommendationStrategy {
  async recommend(userId: string): Promise<Event[]> {
    const topCategories = await prisma.$queryRaw<{ category: string }[]>`
      SELECT e.category, COUNT(*) AS freq
      FROM registrations r
      JOIN events e ON r."eventId" = e.id
      WHERE r."userId" = ${userId} AND r.status = 'CONFIRMED'
      GROUP BY e.category
      ORDER BY freq DESC
      LIMIT 3
    `;

    const categories = topCategories.map((c) => c.category);

    return prisma.$queryRaw<Event[]>`
      SELECT e.*, COUNT(r2.id) AS total_registrations
      FROM events e
      LEFT JOIN registrations r2 ON r2."eventId" = e.id AND r2.status = 'CONFIRMED'
      WHERE e.category = ANY(${categories}::text[])
        AND e.date >= NOW()
        AND e.status = 'AVAILABLE'
        AND e.id NOT IN (
          SELECT "eventId" FROM registrations WHERE "userId" = ${userId}
        )
      GROUP BY e.id
      ORDER BY total_registrations DESC
      LIMIT 5
    `;
  }
}

class PopularityBasedStrategy implements RecommendationStrategy {
  async recommend(_userId: string): Promise<Event[]> {
    return prisma.$queryRaw<Event[]>`
      SELECT e.*, COUNT(r.id) AS total_registrations
      FROM events e
      LEFT JOIN registrations r ON r."eventId" = e.id AND r.status = 'CONFIRMED'
      WHERE e.date >= NOW() AND e.status = 'AVAILABLE'
      GROUP BY e.id
      ORDER BY total_registrations DESC
      LIMIT 5
    `;
  }
}

export class RecommendationService {
  private registrationRepo = new RegistrationRepository();
  private strategy!: RecommendationStrategy;

  setStrategy(strategy: RecommendationStrategy) {
    this.strategy = strategy;
  }

  async getRecommendations(userId: string): Promise<Event[]> {
    const count = await this.registrationRepo.countByUser(userId);
    this.setStrategy(count >= 2 ? new ContentBasedStrategy() : new PopularityBasedStrategy());
    return this.strategy.recommend(userId);
  }
}
