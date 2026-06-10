import { User, UserRole } from "@prisma/client";
import prisma from "../utils/prisma";

export class UserRepository {
  async create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}
