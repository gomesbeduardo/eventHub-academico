import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import logger from "../utils/logger";

const authService = new AuthService();

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        res.status(400).json({ error: "Campos obrigatórios: name, email, password, role" });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Senha deve ter no mínimo 8 caracteres" });
        return;
      }
      // RF01 — valida formato do e-mail antes de confirmar o cadastro
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Formato de e-mail inválido" });
        return;
      }
      const user = await authService.register({ name, email, password, role });
      res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios" });
        return;
      }
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  },

  // RF02 — solicita recuperação de senha. E-mail simulado: o link vai pro log.
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email é obrigatório" });
        return;
      }

      const token = await authService.requestPasswordReset(email);
      if (token) {
        const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
        const link = `${frontendUrl}/reset-password?token=${token}`;
        // Simulação de envio de e-mail: o link aparece no terminal do backend.
        logger.info({ email, link }, "password reset link (simulação de e-mail)");
      }

      // Resposta sempre idêntica — não revela se o e-mail existe.
      res.json({
        message:
          "Se o e-mail estiver cadastrado, um link de recuperação foi enviado.",
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  // RF02 — efetiva a troca de senha usando o token.
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({ error: "Token e nova senha são obrigatórios" });
        return;
      }

      await authService.resetPassword(token, password);
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};