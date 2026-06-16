import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { UserRole } from "../types";
import Select from "../components/Select";

const ROLE_OPTIONS = [
  { value: "PARTICIPANT", label: "Participante" },
  { value: "ORGANIZER",   label: "Organizador"  },
];

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm bg-white/50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300/50 dark:focus:ring-slate-500/30 focus:border-slate-400/50 dark:focus:border-slate-500/40 transition-all";

const labelClass =
  "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

export default function RegisterPage() {
  const { dark, toggle } = useTheme();
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
