import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { UserRole } from "../types";

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
  "w-full rounded-xl px-4 py-3 text-sm bg-white/50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400/30 dark:focus:ring-violet-400/20 focus:border-violet-400/50 dark:focus:border-violet-400/30 transition-all";

const labelClass =
  "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

export default function RegisterPage() {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PARTICIPANT" as UserRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg ?? "Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <button
        onClick={toggle}
        className="glass fixed top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 transition-all cursor-pointer z-10"
        aria-label={dark ? "Modo claro" : "Modo escuro"}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30 mb-4">
            <span className="text-white text-lg font-bold tracking-wider">EH</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            EventHub Acadêmico
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Crie sua conta</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-6">Cadastro</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Nome completo</label>
              <input name="name" placeholder="Seu nome" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>E-mail</label>
              <input name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Senha</label>
              <input name="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Perfil</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="PARTICIPANT">Participante</option>
                <option value="ORGANIZER">Organizador</option>
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium bg-linear-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? "Cadastrando…" : "Criar conta"}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
