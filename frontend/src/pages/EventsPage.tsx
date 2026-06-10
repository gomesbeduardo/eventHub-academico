import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Event, EventCategory, EventStatus } from "../types";

const CATEGORIES: EventCategory[] = ["PALESTRA", "WORKSHOP", "MINICURSO", "SEMINARIO"];

export default function EventsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<{ category?: string; status?: string }>({});

  async function fetchEvents() {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    const { data } = await api.get(`/events?${params}`);
    setEvents(data);
  }

  useEffect(() => { fetchEvents(); }, [filters]);

  async function handleRegister(eventId: string) {
    try {
      await api.post(`/events/${eventId}/register`);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Erro ao inscrever");
    }
  }

  async function handleCancel(eventId: string) {
    if (!confirm("Confirma cancelamento?")) return;
    await api.delete(`/events/${eventId}/register`);
    fetchEvents();
  }

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "1rem" }}>
        <h1>EventHub</h1>
        <div>
          <span>Olá, {user?.name}</span>
          {user?.role === "ORGANIZER" && (
            <button onClick={() => navigate("/dashboard")} style={{ marginLeft: "1rem" }}>
              Dashboard BI
            </button>
          )}
          <button onClick={logout} style={{ marginLeft: "1rem" }}>Sair</button>
        </div>
      </header>

      <div style={{ padding: "1rem" }}>
        <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
          <select onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
            <option value="">Todos os status</option>
            <option value="AVAILABLE">Disponível</option>
            <option value="FULL">Lotado</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {events.map((event) => (
            <div key={event.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: "1rem" }}>
              <h3>{event.name}</h3>
              <p><strong>Categoria:</strong> {event.category}</p>
              <p><strong>Data:</strong> {new Date(event.date).toLocaleDateString("pt-BR")}</p>
              <p><strong>Local:</strong> {event.location}</p>
              <p><strong>Vagas:</strong> {event.totalSlots - event.usedSlots} / {event.totalSlots}</p>
              <span style={{ color: event.status === "FULL" ? "red" : "green" }}>
                {event.status === "FULL" ? "Lotado" : "Disponível"}
              </span>
              {user?.role === "PARTICIPANT" && event.status === "AVAILABLE" && (
                <div style={{ marginTop: "0.5rem" }}>
                  <button onClick={() => handleRegister(event.id)}>Inscrever-se</button>
                  <button onClick={() => handleCancel(event.id)} style={{ marginLeft: "0.5rem" }}>
                    Cancelar inscrição
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
