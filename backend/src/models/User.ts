import { UserRole } from "@prisma/client";

export abstract class UserModel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly role: UserRole
  ) {}

  abstract canCreateEvent(): boolean;
  abstract canRegisterToEvent(): boolean;
}

export class ParticipantUser extends UserModel {
  canCreateEvent() {
    return false;
  }
  canRegisterToEvent() {
    return true;
  }
}

export class OrganizerUser extends UserModel {
  canCreateEvent() {
    return true;
  }
  canRegisterToEvent() {
    return false;
  }
}

// Factory Method (DP02)
export class UserFactory {
  static create(
    role: UserRole,
    data: { id: string; name: string; email: string }
  ): UserModel {
    if (role === "ORGANIZER") return new OrganizerUser(data.id, data.name, data.email, role);
    return new ParticipantUser(data.id, data.name, data.email, role);
  }
}
