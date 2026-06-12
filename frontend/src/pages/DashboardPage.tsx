import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";
import api from "../services/api";
import { AnalyticsMetrics, TrendData, OccupancyData } from "../types";
import Navbar from "../components/Navbar";

const PIE_COLORS = ["#8b5cf6", "#f59e0b", "#10b981", "#6366f1"];

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dark } = useTheme();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [ranking, setRanking] = useState<OccupancyData[]>([]);

  useEffect(() => {
    if (!user || user.role !== "ORGANIZER") { navigate("/"); return; }

    Promise.all([
      api.get(`/analytics/${user.id}/metrics`),
      api.get(`/analytics/${user.id}/trends`),
      api.get(`/analytics/${user.id}/ranking`),
    ]).then(([m, t, r]) => {
      setMetrics(m.data);
      setTrends(t.data);
      setRanking(r.data);
    });
  }, [user, navigate]);

  if (!metrics) {
    return (
      <div className="min-h-screen">
        <Navbar backTo="/" />
        <div className="flex items-center justify-center h-64">
          <div className="glass rounded-2xl px-8 py-6 text-slate-500 dark:text-slate-400 text-sm">
            Carregando dados…
          </div>
        </div>
      </div>
    );
  }

  const totalEvents = metrics.occupancy.length;
  const totalConfirmed = metrics.occupancy.reduce((s, e) => s + e.confirmed, 0);
  const avgOccupancy = totalEvents
    ? Math.round(metrics.occupancy.reduce((s, e) => s + e.occupancyPct, 0) / totalEvents)
    : 0;

  const textColor = dark ? "#94a3b8" : "#64748b";
  const gridColor = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const tooltipStyle = {
    backgroundColor: dark ? "rgba(30,32,48,0.95)" : "rgba(255,255,255,0.95)",
    border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
    borderRadius: "12px",
    color: dark ? "#e2e2ee" : "#1e1e2e",
    fontSize: "13px",
    backdropFilter: "blur(12px)",
  };

  return (
    <div className="min-h-screen">
      <Navbar backTo="/" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            Dashboard BI
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total de eventos" value={totalEvents} />
          <StatCard label="Inscrições confirmadas" value={totalConfirmed} />
          <StatCard label="Ocupação média" value={`${avgOccupancy}%`} sub="média entre todos os eventos" />
        </div>

        {/* Charts — row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5 uppercase tracking-wider">
              Taxa de Ocupação por Evento
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={metrics.occupancy} barSize={24}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Ocupação"]} contentStyle={tooltipStyle} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
                <Bar dataKey="occupancyPct" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Ocupação" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5 uppercase tracking-wider">
              Distribuição por Categoria
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={metrics.categoryDistribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                >
                  {metrics.categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: "12px", color: textColor }} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart — row 2 */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5 uppercase tracking-wider">
            Evolução de Inscrições por Semana
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: textColor }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              />
              <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                formatter={(v) => [v, "Inscrições"]}
                contentStyle={tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Inscrições"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/50 dark:border-white/6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Ranking de Popularidade
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/40 dark:border-white/5">
                  <th className="px-6 py-3 text-left w-10">#</th>
                  <th className="px-6 py-3 text-left">Evento</th>
                  <th className="px-6 py-3 text-right">Inscritos</th>
                  <th className="px-6 py-3 text-right">Vagas</th>
                  <th className="px-6 py-3 text-right">Ocupação</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-200/30 dark:border-white/4 last:border-0 hover:bg-white/30 dark:hover:bg-white/2 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-400 dark:text-slate-500 font-mono">{i + 1}</td>
                    <td className="px-6 py-3.5 text-slate-700 dark:text-slate-200 font-medium">{r.name}</td>
                    <td className="px-6 py-3.5 text-right text-slate-600 dark:text-slate-300">{r.confirmed}</td>
                    <td className="px-6 py-3.5 text-right text-slate-500 dark:text-slate-400">{r.totalSlots}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`font-medium ${r.occupancyPct >= 90 ? "text-rose-500 dark:text-rose-400" : r.occupancyPct >= 70 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {r.occupancyPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
