import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { AnalyticsMetrics, TrendData, OccupancyData, OrganizerOption, EventCategory } from "../types";
import SettingsMenu from "../components/SettingsMenu";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const CATEGORIES: EventCategory[] = ["PALESTRA", "WORKSHOP", "MINICURSO", "SEMINARIO"];
const CATEGORY_LABEL: Record<EventCategory, string> = {
  PALESTRA: "Palestra",
  WORKSHOP: "Workshop",
  MINICURSO: "Minicurso",
  SEMINARIO: "Seminário",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div style={{ fontSize: ".8rem", color: "var(--text-muted)", marginTop: ".25rem" }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [trends,  setTrends]  = useState<TrendData[]>([]);
  const [ranking, setRanking] = useState<OccupancyData[]>([]);
  const [organizers, setOrganizers] = useState<OrganizerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros do dashboard global
  const [filterOrg, setFilterOrg] = useState("");   // "" = todos os organizadores; "me" = os meus
  const [filterCat, setFilterCat] = useState("");    // "" = todas as categorias

  // Carrega a lista de organizadores uma vez (popular o filtro)
  useEffect(() => {
    if (!user || user.role !== "ORGANIZER") { navigate("/"); return; }
    api.get("/analytics/organizers").then((r) => setOrganizers(r.data)).catch(() => setOrganizers([]));
  }, [user]);

  // Recarrega métricas sempre que um filtro muda
  useEffect(() => {
    if (!user || user.role !== "ORGANIZER") return;
    const params: Record<string, string> = {};
    if (filterOrg === "me") params.organizerId = user.id;
    else if (filterOrg) params.organizerId = filterOrg;
    if (filterCat) params.category = filterCat;

    setLoading(true);
    Promise.all([
      api.get("/analytics/metrics", { params }),
      api.get("/analytics/trends", { params }),
      api.get("/analytics/ranking", { params }),
    ]).then(([m, t, r]) => {
      setMetrics(m.data);
      setTrends(t.data);
      setRanking(r.data);
    }).finally(() => setLoading(false));
  }, [user, filterOrg, filterCat]);

  if (loading && !metrics) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (!metrics) return null;

  const totalEvents    = metrics.occupancy.length;
  const totalInscritos = metrics.occupancy.reduce((s, r) => s + r.confirmed, 0);
  const avgOccupancy   = totalEvents > 0
    ? Math.round(metrics.occupancy.reduce((s, r) => s + r.occupancyPct, 0) / totalEvents)
    : 0;

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <button className="navbar-brand" onClick={() => navigate("/")} title="Ir para a página inicial"><span>EventHub</span> Acadêmico</button>
        <div className="navbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>← Voltar</button>
          <SettingsMenu>
            <button className="settings-item" onClick={toggleTheme}>
              {dark ? "☀️ Modo claro" : "🌙 Modo escuro"}
            </button>
          </SettingsMenu>
        </div>
      </nav>

      <main className="page">
        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <h1>Dashboard BI</h1>
            <p style={{ marginTop: ".25rem" }}>
              Métricas de todos os eventos da plataforma. Use os filtros para refinar.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-bar" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group" style={{ minWidth: 220 }}>
            <label>Organizador</label>
            <select value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)}>
              <option value="">Todos os organizadores</option>
              <option value="me">Apenas os meus eventos</option>
              {organizers
                .filter((o) => o.id !== user?.id)
                .map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 200 }}>
            <label>Categoria</label>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>
          {(filterOrg || filterCat) && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: "flex-end" }}
              onClick={() => { setFilterOrg(""); setFilterCat(""); }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div className="stat-cards">
          <StatCard label="Total de Eventos" value={totalEvents} />
          <StatCard label="Total de Inscritos" value={totalInscritos} />
          <StatCard label="Ocupação Média" value={`${avgOccupancy}%`} />
          <StatCard
            label="Evento Mais Popular"
            value={ranking[0]?.name ?? "—"}
            sub={ranking[0] ? `${ranking[0].occupancyPct}% de ocupação` : undefined}
          />
        </div>

        <div className="dashboard-grid">
          {/* Gráfico de barras — Ocupação */}
          <div className="dashboard-card" style={{ gridColumn: "1 / -1" }}>
            <h2>Taxa de Ocupação por Evento</h2>
            {metrics.occupancy.length === 0 ? (
              <p style={{ textAlign: "center", padding: "2rem" }}>Sem dados ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metrics.occupancy} margin={{ top: 4, right: 16, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Ocupação"]} />
                  <Bar dataKey="occupancyPct" fill="#6366f1" radius={[6, 6, 0, 0]} name="Ocupação" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfico de pizza — Categorias */}
          <div className="dashboard-card">
            <h2>Distribuição por Categoria</h2>
            {metrics.categoryDistribution.length === 0 ? (
              <p style={{ textAlign: "center", padding: "2rem" }}>Sem dados ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metrics.categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%" cy="50%"
                    outerRadius={90}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {metrics.categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfico de linha — Tendência */}
          <div className="dashboard-card">
            <h2>Evolução de Inscrições por Semana</h2>
            {trends.length === 0 ? (
              <p style={{ textAlign: "center", padding: "2rem" }}>Sem dados ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trends} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1" }}
                    name="Inscrições"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabela — Ranking */}
          <div className="dashboard-card full-width">
            <h2>Ranking de Popularidade</h2>
            {ranking.length === 0 ? (
              <p style={{ textAlign: "center", padding: "2rem" }}>Sem dados ainda.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Evento</th>
                      <th>Organizador</th>
                      <th style={{ textAlign: "right" }}>Inscritos</th>
                      <th style={{ textAlign: "right" }}>Vagas</th>
                      <th style={{ textAlign: "right" }}>Ocupação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, i) => (
                      <tr key={r.id}>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 26, height: 26, borderRadius: "50%",
                            background: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : "transparent",
                            fontWeight: 700, fontSize: ".85rem",
                            color: i === 0 ? "#92400e" : "var(--text-muted)",
                          }}>
                            {i + 1}
                          </span>
                        </td>
                        <td><strong>{r.name}</strong></td>
                        <td style={{ color: "var(--text-muted)" }}>{r.organizerName ?? "—"}</td>
                        <td style={{ textAlign: "right" }}>{r.confirmed}</td>
                        <td style={{ textAlign: "right" }}>{r.totalSlots}</td>
                        <td style={{ textAlign: "right" }}>
                          <span style={{
                            fontWeight: 600,
                            color: r.occupancyPct >= 80 ? "var(--danger)" : r.occupancyPct >= 50 ? "var(--warning)" : "var(--success)",
                          }}>
                            {r.occupancyPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
