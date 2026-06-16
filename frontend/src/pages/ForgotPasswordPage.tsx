import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch {
      setError("Não foi possível processar a solicitação. Tente novamente.");
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
        <p className="auth-subtitle">Recuperação de senha</p>

        {message ? (
          <div className="alert alert-success">{message}</div>
        ) : (
          <>
            {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>E-mail cadastrado</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          </>
        )}

        <div className="auth-divider" style={{ margin: "1rem 0" }} />
        <div className="auth-footer">
          <Link to="/login">← Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
