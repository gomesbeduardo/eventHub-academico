import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Event, EventCategory, EventStatus } from "../types";
import Navbar from "../components/Navbar";

const CATEGORIES: EventCategory[] = ["PALESTRA", "WORKSHOP", "MINICURSO", "SEMINARIO"];

const CATEGORY_LABEL: Record<EventCategory, string> = {
  PALESTRA: "Palestra",
  WORKSHOP: "Workshop",
  MINICURSO: "Minicurso",
  SEMINARIO: "Seminário",
};

const CATEGORY_COLOR: Record<EventCategory, string> = {
  PALESTRA: "bg-blue-100/70 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  WORKSHOP: "bg-amber-100/70 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  MINICURSO: "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  SEMINARIO: "bg-violet-100/70 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

const STATUS_COLOR: Record<EventStatus, string> = {
  AVAILABLE: "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  FULL: "bg-rose-100/70 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  FINISHED: "bg-slate-100/70 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400",
};

const STATUS_LABEL: Record<EventStatus, string> = {
  AVAILABLE: "Disponível",
  FULL: "Lotado",
  FINISHED: "Encerrado",
};

const selectClass =
  "glass rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all cursor-pointer";

export default function EventsPage() {
  const { user } = useAuth();
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      alert(msg ?? "Erro ao inscrever");
    }
  }

  async function handleCancel(eventId: string) {
    if (!confirm("Confirma cancelamento da inscrição?")) return;
    await api.delete(`/events/${eventId}/register`);
    fetchEvents();
  }

  return (
    <div className="min-h-screen">
      <Navbar showDashboard={user?.role === "ORGANIZER"} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            Eventos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {events.length} evento{events.length !== 1 ? "s" : ""} encontrado{events.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            className={selectClass}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
          >
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>

          <select
            className={selectClass}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
          >
            <option value="">Todos os status</option>
            <option value="AVAILABLE">Disponível</option>
            <option value="FULL">Lotado</option>
            <option value="FINISHED">Encerrado</option>
          </select>
        </div>

        {/* Grid */}
        {events.length === 0 ? (
          <div className="glass-strong rounded-3xl p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum evento encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const pct = event.totalSlots > 0
                ? Math.min(100, (event.usedSlots / event.totalSlots) * 100)
                : 0;
              const barColor =
                pct >= 100 ? "bg-rose-400" :
                pct >= 75 ? "bg-amber-400" : "bg-emerald-400";

              return (
                <div key={event.id} className="glass rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/50 dark:hover:bg-white/5 transition-all">
                  {/* Top row: category + status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${CATEGORY_COLOR[event.category]}`}>
                      {CATEGORY_LABEL[event.category]}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_COLOR[event.status]}`}>
                      {STATUS_LABEL[event.status]}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {event.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {new Date(event.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  {/* Slots progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>Vagas</span>
                      <span>{event.usedSlots} / {event.totalSlots}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions — participant only */}
                  {user?.role === "PARTICIPANT" && event.status === "AVAILABLE" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRegister(event.id)}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-medium bg-linear-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-sm shadow-violet-500/20 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        Inscrever-se
                      </button>
                      <button
                        onClick={() => handleCancel(event.id)}
                        className="glass rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-rose-50/70 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
