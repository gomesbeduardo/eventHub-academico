import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import GridCanvas from "../components/GridCanvas";

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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const info = (location.state as { info?: string } | null)?.info ?? "";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Parallax refs para blobs e card
  const pageRef  = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

    if (blob1Ref.current) blob1Ref.current.style.transform = `translate(${x * 30}px, ${y * 20}px)`;
    if (blob2Ref.current) blob2Ref.current.style.transform = `translate(${-x * 25}px, ${-y * 18}px)`;
    if (cardRef.current)  cardRef.current.style.transform  = `perspective(800px) rotateX(${y * 4}deg) rotateY(${-x * 4}deg) translateZ(8px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (blob1Ref.current) blob1Ref.current.style.transform = "";
    if (blob2Ref.current) blob2Ref.current.style.transform = "";
    if (cardRef.current)  cardRef.current.style.transform  = "";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate("/");
    } catch {
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-page"
      ref={pageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grade interativa com efeito de onda por célula */}
      <GridCanvas />

      {/* Blobs com parallax */}
      <div ref={blob1Ref} className="auth-blob auth-blob-1" />
      <div ref={blob2Ref} className="auth-blob auth-blob-2" />

      <div className="auth-card" ref={cardRef}>
        <div className="auth-logo">🎓 EventHub <span>Acadêmico</span></div>
        <p className="auth-subtitle">Acesse sua conta para continuar</p>

        {info  && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{info}</div>}
        {error && <div className="alert alert-error"   style={{ marginBottom: "1rem" }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: ".25rem", justifyContent: "center" }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: ".75rem" }}>
          <Link to="/forgot-password">Esqueci minha senha</Link>
        </div>
        <div className="auth-divider" style={{ margin: "1rem 0" }} />
        <div className="auth-footer">
          Não tem conta? <Link to="/register">Cadastre-se grátis</Link>
        </div>
      </div>
    </div>
  );
}
