import { Event } from "@prisma/client";

// Strategy Pattern (DP03)
export interface RecommendationStrategy {
  recommend(userId: string): Promise<Event[]>;
}
