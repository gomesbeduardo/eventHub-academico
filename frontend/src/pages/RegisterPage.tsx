import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { UserRole } from "../types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: "", email: "", password: "", role: "PARTICIPANT" as UserRole });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Senha deve ter no mínimo 8 caracteres."); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/login", { state: { info: "Conta criada com sucesso! Faça login." } });
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid" />
      <div className="auth-bg-orbs"><span /><span /><span /><span /><span /><span /></div>
      <div className="auth-card">
        <div className="auth-logo">🎓 EventHub <span>Acadêmico</span></div>
        <p className="auth-subtitle">Crie sua conta gratuitamente</p>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo</label>
            <input name="name" placeholder="Seu nome" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input name="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Perfil</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="PARTICIPANT">Participante — me inscrevo em eventos</option>
              <option value="ORGANIZER">Organizador — crio e gerencio eventos</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: ".25rem" }} disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: "1rem 0" }} />
        <div className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
