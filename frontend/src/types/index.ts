export type UserRole = "PARTICIPANT" | "ORGANIZER";

export type EventCategory = "PALESTRA" | "WORKSHOP" | "MINICURSO" | "SEMINARIO";

export type EventStatus = "AVAILABLE" | "FULL" | "FINISHED";

export type RegistrationStatus = "CONFIRMED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  totalSlots: number;
  usedSlots: number;
  status: EventStatus;
  organizerId: string;
}

export interface Registration {
  id: string;
  status: RegistrationStatus;
  createdAt: string;
  event: Event;
}

export interface OccupancyData {
  id: string;
  name: string;
  organizerName?: string;
  totalSlots: number;
  confirmed: number;
  occupancyPct: number;
}

export interface OrganizerOption {
  id: string;
  name: string;
}

export interface CategoryData {
  category: EventCategory;
  count: number;
}

export interface TrendData {
  week: string;
  registrations: number;
}

export interface AnalyticsMetrics {
  occupancy: OccupancyData[];
  categoryDistribution: CategoryData[];
}
