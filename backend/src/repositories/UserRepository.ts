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

  async setResetToken(userId: string, tokenHash: string, expiry: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { resetToken: tokenHash, resetTokenExpiry: expiry },
    });
  }

  async findByResetToken(tokenHash: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { resetToken: tokenHash } });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });
  }
}
