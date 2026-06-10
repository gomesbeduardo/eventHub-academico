import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { UserRole } from "../types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PARTICIPANT" as UserRole });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Senha deve ter no mínimo 8 caracteres");
      return;
    }
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erro ao cadastrar");
    }
  }

  return (
    <div className="auth-container">
      <h1>EventHub Acadêmico</h1>
      <h2>Cadastro</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Nome completo" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="E-mail" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Senha (mín. 8 caracteres)" value={form.password} onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="PARTICIPANT">Participante</option>
          <option value="ORGANIZER">Organizador</option>
        </select>
        {error && <p className="error">{error}</p>}
        <button type="submit">Cadastrar</button>
      </form>
      <p>Já tem conta? <Link to="/login">Entrar</Link></p>
    </div>
  );
}
