import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import api, { getRecommendations } from "../services/api";
import { Event, EventCategory, EventStatus, Registration } from "../types";
import SettingsMenu from "../components/SettingsMenu";

interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = "events" | "recommended" | "history" | "my-events";

interface EventForm {
  name: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  totalSlots: string;
}

interface Registrant {
  id: string;
  user: { id: string; name: string; email: string };
}

const EMPTY_FORM: EventForm = {
  name: "",
  description: "",
  category: "PALESTRA",
  date: "",
  location: "",
  totalSlots: "",
};

const CATEGORIES: EventCategory[] = [
  "PALESTRA",
  "WORKSHOP",
  "MINICURSO",
  "SEMINARIO",
];

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatDateTimeLocal(d: string) {
  return new Date(d).toISOString().slice(0, 16);
}
function occupancyPct(e: Event) {
  return e.totalSlots > 0 ? Math.round((e.usedSlots / e.totalSlots) * 100) : 0;
}

// ── Slots Bar ──────────────────────────────────────────────────────────────
function SlotsBar({ event }: { event: Event }) {
  const pct = occupancyPct(event);
  return (
    <div className="slots-bar-wrap">
      <div className="slots-bar-label">
        <span>{event.totalSlots - event.usedSlots} vagas livres</span>
        <span>{pct}%</span>
      </div>
      <div className="slots-bar">
        <div
          className={`slots-bar-fill ${event.status === "FULL" ? "full" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { cls: string; label: string }> = {
    AVAILABLE: { cls: "badge-available", label: "Disponível" },
    FULL: { cls: "badge-full", label: "Lotado" },
    FINISHED: { cls: "badge-finished", label: "Encerrado" },
  };
  const { cls, label } = map[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function EventsPage() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isOrganizer = user?.role === "ORGANIZER";

  const [tab, setTab] = useState<Tab>(isOrganizer ? "my-events" : "events");

  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [history, setHistory] = useState<Registration[]>([]);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);

  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRegistrants, setShowRegistrants] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  // Diálogos centralizados (substituem confirm()/alert() nativos)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterCat) params.set("category", filterCat);
    if (filterStatus) params.set("status", filterStatus);
    const { data } = await api.get(`/events?${params}`);
    setEvents(data);
  }, [filterCat, filterStatus]);

  const fetchMyEvents = useCallback(async () => {
    if (!isOrganizer) return;
    const { data } = await api.get("/events/mine");
    setMyEvents(data);
  }, [isOrganizer]);

  const fetchHistory = useCallback(async () => {
    if (isOrganizer) return;
    const { data } = await api.get("/registrations/history");
    setHistory(data);
  }, [isOrganizer]);

  const fetchRecommendations = useCallback(async () => {
    if (!user || isOrganizer) return;
    try {
      const { data } = await getRecommendations(user.id);
      setRecommendations(data);
    } catch {
      setRecommendations([]);
    }
  }, [user, isOrganizer]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // ── Participant actions ──────────────────────────────────────────────────
  function handleRegister(event: Event) {
    setConfirmDialog({
      title: "Confirmar inscrição",
      message: `Deseja se inscrever em "${event.name}"?`,
      confirmLabel: "Inscrever-se",
      onConfirm: async () => {
        try {
          await api.post(`/events/${event.id}/register`);
          fetchEvents();
          fetchRecommendations();
        } catch (err: any) {
          setFeedback(err.response?.data?.error ?? "Erro ao inscrever");
        }
      },
    });
  }

  function handleCancel(event: Event) {
    setConfirmDialog({
      title: "Cancelar inscrição",
      message: `Confirma o cancelamento da inscrição em "${event.name}"?`,
      confirmLabel: "Cancelar inscrição",
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/events/${event.id}/register`);
          fetchEvents();
          fetchHistory();
          fetchRecommendations();
        } catch (err: any) {
          setFeedback(err.response?.data?.error ?? "Erro ao cancelar");
        }
      },
    });
  }

  // ── Form helpers ─────────────────────────────────────────────────────────
  function formChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowCreate(true);
  }

  function openEdit(event: Event) {
    setEditingEvent(event);
    setForm({
      name: event.name,
      description: event.description,
      category: event.category,
      date: formatDateTimeLocal(event.date),
      location: event.location,
      totalSlots: String(event.totalSlots),
    });
    setFormError("");
    setShowEdit(true);
  }

  async function openRegistrants(event: Event) {
    setViewingEvent(event);
    try {
      const { data } = await api.get(`/events/${event.id}/registrations`);
      setRegistrants(data);
    } catch {
      setRegistrants([]);
    }
    setShowRegistrants(true);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormBusy(true);
    try {
      await api.post("/events", {
        ...form,
        totalSlots: Number(form.totalSlots),
        date: new Date(form.date).toISOString(),
      });
      setShowCreate(false);
      fetchMyEvents();
      fetchEvents();
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? "Erro ao criar evento");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;
    setFormError("");
    setFormBusy(true);
    try {
      await api.put(`/events/${editingEvent.id}`, {
        ...form,
        totalSlots: Number(form.totalSlots),
        date: new Date(form.date).toISOString(),
      });
      setShowEdit(false);
      fetchMyEvents();
      fetchEvents();
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? "Erro ao editar evento");
    } finally {
      setFormBusy(false);
    }
  }

  function handleDelete(event: Event) {
    setConfirmDialog({
      title: "Excluir evento",
      message: `Excluir "${event.name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/events/${event.id}`);
          fetchMyEvents();
          fetchEvents();
        } catch (err: any) {
          setFeedback(err.response?.data?.error ?? "Erro ao excluir evento");
        }
      },
    });
  }

  // ── Event Card ───────────────────────────────────────────────────────────
  function EventCard({
    event,
    variant = "default",
  }: {
    event: Event;
    variant?: "default" | "recommended" | "mine";
  }) {
    const isPast = new Date(event.date) < new Date();
    return (
      <div
        className={`event-card ${variant === "recommended" ? "recommended" : ""}`}
      >
        <div className="event-card-header">
          <h3>{event.name}</h3>
          <StatusBadge
            status={
              isPast && event.status === "AVAILABLE" ? "FINISHED" : event.status
            }
          />
        </div>
        <span className="badge badge-category">{event.category}</span>
        <div className="event-meta">
          <div className="event-meta-item">
            <span>📅</span>
            <strong>{formatDate(event.date)}</strong>
          </div>
          <div className="event-meta-item">
            <span>📍</span>
            <span>{event.location}</span>
          </div>
        </div>
        <SlotsBar event={event} />
        <div className="event-card-actions">
          {variant === "mine" ? (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => openRegistrants(event)}
              >
                👥 Inscritos ({event.usedSlots})
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => openEdit(event)}
              >
                ✏️ Editar
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(event)}
              >
                🗑️ Excluir
              </button>
            </>
          ) : !isOrganizer && !isPast && event.status === "AVAILABLE" ? (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleRegister(event)}
              >
                Inscrever-se
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleCancel(event)}
              >
                Cancelar inscrição
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // ── Tabs config ──────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string }[] = isOrganizer
    ? [
        { key: "my-events", label: "Meus Eventos" },
        { key: "events", label: "Explorar" },
      ]
    : [
        { key: "events", label: "Eventos" },
        { key: "recommended", label: "Recomendados" },
        { key: "history", label: "Histórico" },
      ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <button className="navbar-brand" onClick={() => navigate("/")} title="Ir para a página inicial">
          <span>EventHub</span> Acadêmico
        </button>
        <div className="navbar-right">
          <span className="navbar-user">Olá, {user?.name}</span>
          <span
            className={`role-badge ${isOrganizer ? "organizer" : "participant"}`}
          >
            {isOrganizer ? "Organizador" : "Participante"}
          </span>
          {isOrganizer && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/dashboard")}
            >
              📊 Dashboard BI
            </button>
          )}
          <SettingsMenu>
            <button className="settings-item" onClick={toggleTheme}>
              {dark ? "☀️ Modo claro" : "🌙 Modo escuro"}
            </button>
            <button className="settings-item" onClick={logout}>
              ↩ Sair
            </button>
          </SettingsMenu>
        </div>
      </nav>

      <main className="page">
        {/* Tabs */}
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === "recommended" && recommendations.length > 0 && (
                <span
                  style={{
                    marginLeft: ".4rem",
                    background: "var(--primary)",
                    color: "#fff",
                    borderRadius: "999px",
                    padding: "0 .45rem",
                    fontSize: ".7rem",
                  }}
                >
                  {recommendations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Meus Eventos ── */}
        {tab === "my-events" && (
          <>
            <div className="section-header">
              <h2>Meus Eventos</h2>
              <button className="btn btn-primary" onClick={openCreate}>
                + Criar Evento
              </button>
            </div>
            {myEvents.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2.5rem" }}>📅</div>
                <p>Você ainda não criou nenhum evento.</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: "1rem" }}
                  onClick={openCreate}
                >
                  Criar primeiro evento
                </button>
              </div>
            ) : (
              <div className="cards-grid">
                {myEvents.map((e) => (
                  <EventCard key={e.id} event={e} variant="mine" />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Explorar / Eventos ── */}
        {tab === "events" && (
          <>
            <div className="section-header">
              <h2>{isOrganizer ? "Explorar Eventos" : "Todos os Eventos"}</h2>
            </div>
            <div className="filters-bar">
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="AVAILABLE">Disponível</option>
                <option value="FULL">Lotado</option>
              </select>
            </div>
            {events.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2.5rem" }}>🔍</div>
                <p>Nenhum evento encontrado.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Recomendados ── */}
        {tab === "recommended" && !isOrganizer && (
          <>
            <div className="section-header">
              <h2>Recomendados pra você</h2>
            </div>
            {recommendations.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2.5rem" }}>✨</div>
                <p>Ainda não temos recomendações para você.</p>
                <p style={{ fontSize: ".875rem", marginTop: ".5rem" }}>
                  Inscreva-se em pelo menos 2 eventos para receber sugestões
                  personalizadas.
                </p>
              </div>
            ) : (
              <div className="cards-grid">
                {recommendations.map((e) => (
                  <EventCard key={e.id} event={e} variant="recommended" />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Histórico ── */}
        {tab === "history" && !isOrganizer && (
          <>
            <div className="section-header">
              <h2>Histórico de Inscrições</h2>
            </div>
            {history.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2.5rem" }}>📋</div>
                <p>Você ainda não se inscreveu em nenhum evento.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Categoria</th>
                      <th>Data</th>
                      <th>Local</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((reg) => {
                      const isPast = new Date(reg.event.date) < new Date();
                      return (
                        <tr key={reg.id}>
                          <td>
                            <strong>{reg.event.name}</strong>
                          </td>
                          <td>
                            <span className="badge badge-category">
                              {reg.event.category}
                            </span>
                          </td>
                          <td>{formatDate(reg.event.date)}</td>
                          <td>{reg.event.location}</td>
                          <td>
                            {isPast && reg.status === "CONFIRMED" ? (
                              <span className="badge badge-finished">
                                Encerrado
                              </span>
                            ) : (
                              <span
                                className={`badge ${reg.status === "CONFIRMED" ? "badge-confirmed" : "badge-cancelled"}`}
                              >
                                {reg.status === "CONFIRMED"
                                  ? "Confirmada"
                                  : "Cancelada"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Modal: Criar Evento ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar Evento</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreate(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-error">{formError}</div>
                )}
                <div className="form-group">
                  <label>Nome do evento</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={formChange}
                    placeholder="Ex: Workshop de React"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={formChange}
                    placeholder="Descreva o evento..."
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={formChange}
                      required
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vagas</label>
                    <input
                      name="totalSlots"
                      type="number"
                      min="1"
                      value={form.totalSlots}
                      onChange={formChange}
                      placeholder="50"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Data e horário</label>
                    <input
                      name="date"
                      type="datetime-local"
                      value={form.date}
                      onChange={formChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Local</label>
                    <input
                      name="location"
                      value={form.location}
                      onChange={formChange}
                      placeholder="Sala 201 — Bloco B"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formBusy}
                >
                  {formBusy ? "Salvando..." : "Criar evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Evento ── */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Evento</h2>
              <button
                className="modal-close"
                onClick={() => setShowEdit(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-error">{formError}</div>
                )}
                <div className="form-group">
                  <label>Nome do evento</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={formChange}
                    placeholder="Ex: Workshop de React"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={formChange}
                    placeholder="Descreva o evento..."
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={formChange}
                      required
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vagas</label>
                    <input
                      name="totalSlots"
                      type="number"
                      min="1"
                      value={form.totalSlots}
                      onChange={formChange}
                      placeholder="50"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Data e horário</label>
                    <input
                      name="date"
                      type="datetime-local"
                      value={form.date}
                      onChange={formChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Local</label>
                    <input
                      name="location"
                      value={form.location}
                      onChange={formChange}
                      placeholder="Sala 201 — Bloco B"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowEdit(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formBusy}
                >
                  {formBusy ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Inscritos ── */}
      {showRegistrants && (
        <div
          className="modal-overlay"
          onClick={() => setShowRegistrants(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Inscritos — {viewingEvent?.name}</h2>
              <button
                className="modal-close"
                onClick={() => setShowRegistrants(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {registrants.length === 0 ? (
                <p style={{ textAlign: "center", padding: "1rem 0" }}>
                  Nenhum inscrito ainda.
                </p>
              ) : (
                registrants.map((r) => (
                  <div key={r.id} className="registrant-item">
                    <div className="registrant-avatar">
                      {r.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="registrant-info">
                      <div className="registrant-name">{r.user.name}</div>
                      <div className="registrant-email">{r.user.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <span className="helper-text">
                {registrants.length} inscrito(s)
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setShowRegistrants(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmação (inscrição / cancelamento / exclusão) ── */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{confirmDialog.title}</h2>
              <button className="modal-close" onClick={() => setConfirmDialog(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text)" }}>{confirmDialog.message}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDialog(null)}
                disabled={confirmBusy}
              >
                Voltar
              </button>
              <button
                className={`btn ${confirmDialog.danger ? "btn-danger" : "btn-primary"}`}
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  try {
                    await confirmDialog.onConfirm();
                  } finally {
                    setConfirmBusy(false);
                    setConfirmDialog(null);
                  }
                }}
              >
                {confirmBusy ? "Processando..." : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Feedback / erro ── */}
      {feedback && (
        <div className="modal-overlay" onClick={() => setFeedback("")}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Aviso</h2>
              <button className="modal-close" onClick={() => setFeedback("")}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text)" }}>{feedback}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setFeedback("")}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
