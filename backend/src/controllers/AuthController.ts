import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

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
};
