import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { UserRepository } from "../repositories/UserRepository";
import { UserFactory } from "../models/User";

const BCRYPT_ROUNDS = 10;

export class AuthService {
  private userRepo = new UserRepository();

  async register(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error("Email já cadastrado");

    const hashed = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await this.userRepo.create({ ...data, password: hashed });
    return UserFactory.create(user.role, user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("Credenciais inválidas");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Credenciais inválidas");

    const secret = process.env.JWT_SECRET!;
    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"] };
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      secret,
      signOptions
    );

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}
