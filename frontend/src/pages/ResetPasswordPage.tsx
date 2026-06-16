import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token    = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8)     { setError("A senha deve ter no mínimo 8 caracteres."); return; }
    if (password !== confirm)    { setError("As senhas não coincidem.");                  return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      navigate("/login", { state: { info: "Senha redefinida com sucesso. Faça login." } });
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Token inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-grid" />
        <div className="auth-bg-orbs"><span /><span /><span /><span /><span /><span /></div>
        <div className="auth-card">
          <div className="auth-logo"> EventHub <span>Acadêmico</span></div>
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            Link de recuperação inválido ou já utilizado.
          </div>
          <div className="auth-footer"><Link to="/login">Voltar para o login</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-grid" />
      <div className="auth-bg-orbs"><span /><span /><span /><span /><span /><span /></div>
      <div className="auth-card">
        <div className="auth-logo">🎓 EventHub <span>Acadêmico</span></div>
        <p className="auth-subtitle">Crie uma nova senha</p>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nova senha</label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirmar nova senha</label>
            <input
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: "1rem 0" }} />
        <div className="auth-footer"><Link to="/login">← Voltar para o login</Link></div>
      </div>
    </div>
  );
}
