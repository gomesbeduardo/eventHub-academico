import crypto from "crypto";
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

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * RF02 — recuperação de senha (passo 1).
   * Gera um token temporário (válido por 1h), guarda apenas o HASH no banco
   * e retorna o token cru para o controller montar o link.
   * Retorna `null` quando o e-mail não existe, mas o controller NÃO revela isso
   * (evita enumeração de e-mails cadastrados).
   */
  async requestPasswordReset(email: string): Promise<string | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await this.userRepo.setResetToken(user.id, this.hashToken(rawToken), expiry);

    return rawToken;
  }

  /**
   * RF02 — recuperação de senha (passo 2).
   * Valida o token (existência + expiração) e troca a senha.
   */
  async resetPassword(rawToken: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new Error("Senha deve ter no mínimo 8 caracteres");
    }

    const user = await this.userRepo.findByResetToken(this.hashToken(rawToken));
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new Error("Token inválido ou expirado");
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepo.updatePassword(user.id, hashed);
  }
}