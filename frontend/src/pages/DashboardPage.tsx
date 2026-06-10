import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";
import api from "../services/api";
import { AnalyticsMetrics, TrendData, OccupancyData } from "../types";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444"];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  }, [user]);

  if (!metrics) return <p>Carregando...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: "1rem" }}>← Voltar</button>
      <h1>Dashboard BI — {user?.name}</h1>

      <h2>Taxa de Ocupação por Evento</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={metrics.occupancy}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis unit="%" />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="occupancyPct" fill="#6366f1" name="Ocupação" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Distribuição por Categoria</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={metrics.categoryDistribution} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
            {metrics.categoryDistribution.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <h2>Evolução de Inscrições por Semana</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="registrations" stroke="#6366f1" name="Inscrições" />
        </LineChart>
      </ResponsiveContainer>

      <h2>Ranking de Popularidade</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={{ padding: "0.5rem", textAlign: "left" }}>#</th>
            <th style={{ padding: "0.5rem", textAlign: "left" }}>Evento</th>
            <th style={{ padding: "0.5rem", textAlign: "right" }}>Inscritos</th>
            <th style={{ padding: "0.5rem", textAlign: "right" }}>Vagas</th>
            <th style={{ padding: "0.5rem", textAlign: "right" }}>Ocupação</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.5rem" }}>{i + 1}</td>
              <td style={{ padding: "0.5rem" }}>{r.name}</td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>{r.confirmed}</td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>{r.totalSlots}</td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>{r.occupancyPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
