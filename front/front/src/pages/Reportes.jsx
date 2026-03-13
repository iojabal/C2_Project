import React, { useState, useEffect } from "react";
import {
  FileText,
  Monitor,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  RefreshCw,
  Eye,
  Server,
  Clock,
  Database,
  Network,
  Cpu,
} from "lucide-react";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const BG     = "#0d1117";
const CARD   = "#161b22";
const BORDER = "#21262d";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    let date;
    if (dateString.includes("T")) {
      date = new Date(dateString);
    } else if (dateString.includes(" ")) {
      const clean = dateString.split(" ").slice(0, 2).join(" ").replace(/\.\d+/, "");
      date = new Date(clean);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function osIcon(os = "") {
  const l = os.toLowerCase();
  if (l.includes("windows")) return "⊞";
  if (l.includes("darwin") || l.includes("mac")) return "";
  return "🐧";
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function StatusPill({ connected, active }) {
  if (connected && active)
    return (
      <span
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        ACTIVO
      </span>
    );
  if (connected)
    return (
      <span
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(88,166,255,0.15)", color: "#58a6ff", border: "1px solid rgba(88,166,255,0.3)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        CONECTADO
      </span>
    );
  return (
    <span
      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(110,118,129,0.15)", color: "#6e7681", border: "1px solid rgba(110,118,129,0.3)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      OFFLINE
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 rounded-xl border"
      style={{ background: CARD, borderColor: BORDER }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: "#6e7681" }}>{label}</p>
        <p className="text-xl font-bold font-mono" style={{ color: "#e6edf3" }}>{value}</p>
      </div>
    </div>
  );
}

function ReportCard({ report, formatDate }) {
  return (
    <div
      className="rounded-lg border cursor-pointer transition-all duration-150 hover:translate-y-[-1px]"
      style={{ background: "#0d1117", borderColor: "#30363d" }}
      onClick={() => window.open(`/report/${report.id}`, "_blank")}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded"
              style={{ background: "rgba(88,166,255,0.12)", border: "1px solid rgba(88,166,255,0.2)" }}
            >
              <Database size={13} style={{ color: "#58a6ff" }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
                {report.hostname || "—"}
              </h4>
              <p className="text-xs" style={{ color: "#6e7681" }}>Auditoría</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "#484f58" }}>
            <Clock size={10} />
            {formatDate(report.LastSeen)}
          </span>
        </div>

        {/* Grid datos */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          {[
            { label: "Usuario", value: report.user || "N/A" },
            { label: "Procesos", value: report.processes?.length ?? 0 },
            { label: "Conexiones", value: report.connections?.length ?? 0 },
            { label: "IPs", value: report.ips?.length ?? 0 },
            { label: "Gateway", value: report.gateway || "N/A" },
            {
              label: "Privilegios",
              value: report.elevated ? "Elevado" : "Estándar",
              color: report.elevated ? "#d29922" : "#3fb950",
            },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p style={{ color: "#484f58" }}>{label}</p>
              <p className="font-mono font-medium" style={{ color: color || "#8b949e" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Anti-debug badge */}
        {report.antidebug && (
          <div
            className="flex items-center gap-1 text-xs px-2 py-1 rounded mb-2"
            style={{ background: "rgba(210,153,34,0.12)", color: "#d29922", border: "1px solid rgba(210,153,34,0.25)" }}
          >
            <AlertTriangle size={10} />
            Anti-debug detectado
          </div>
        )}

        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #21262d" }}>
          <span className="text-xs font-medium" style={{ color: "#58a6ff" }}>
            Ver detalle completo
          </span>
          <Eye size={13} style={{ color: "#58a6ff" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const Reportes = () => {
  const [agentsWithReports, setAgentsWithReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAgentsWithReports();
  }, []);

  const fetchAgentsWithReports = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/v1/agents-with-reports");
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setAgentsWithReports(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAgentReports = async (agentUUID) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/agents/${agentUUID}/reports`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    } catch {
      return [];
    }
  };

  const handleExpandAgent = async (agent) => {
    if (expandedAgent === agent.UUID) {
      setExpandedAgent(null);
      return;
    }
    setExpandedAgent(agent.UUID);
    if (agent.reportCount > 0 && (!agent.reports || agent.reports.length === 0)) {
      const reports = await fetchAgentReports(agent.UUID);
      setAgentsWithReports((prev) =>
        prev.map((a) => (a.UUID === agent.UUID ? { ...a, reports } : a))
      );
    }
  };

  const filteredAgents = agentsWithReports.filter((agent) => {
    const matchesSearch =
      agent.Hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.UUID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.OS?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === "with-reports") return matchesSearch && agent.reportCount > 0;
    if (filterType === "without-reports") return matchesSearch && agent.reportCount === 0;
    if (filterType === "active") return matchesSearch && agent.Active;
    if (filterType === "connected") return matchesSearch && agent.Connected;
    return matchesSearch;
  });

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: BG }}>
        <div className="flex items-center gap-3 font-mono text-sm" style={{ color: "#6e7681" }}>
          <RefreshCw size={16} className="animate-spin" style={{ color: "#58a6ff" }} />
          Cargando reportes...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: BG }}>

      {/* ── Header sticky ── */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{ background: `${BG}e8`, borderColor: BORDER, backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={18} style={{ color: "#58a6ff" }} />
            <div>
              <h1 className="text-base font-bold" style={{ color: "#e6edf3" }}>
                Reportes y Análisis
              </h1>
              <p className="text-xs" style={{ color: "#6e7681" }}>
                Auditorías de agentes
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchAgentsWithReports(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Monitor}       label="Total Agentes"   value={filteredAgents.length}                                               color="#58a6ff" />
          <StatCard icon={FileText}      label="Total Reportes"  value={filteredAgents.reduce((s, a) => s + (a.reportCount || 0), 0)}        color="#3fb950" />
          <StatCard icon={Activity}      label="Activos"         value={filteredAgents.filter((a) => a.Active).length}                       color="#d29922" />
          <StatCard icon={Database}      label="Con Reportes"    value={filteredAgents.filter((a) => a.reportCount > 0).length}              color="#bc8cff" />
        </div>

        {/* ── Filtros ── */}
        <div
          className="rounded-xl border p-4"
          style={{ background: CARD, borderColor: BORDER }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#484f58" }}
              />
              <input
                type="text"
                placeholder="Buscar hostname, UUID, OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-lg text-sm font-mono outline-none"
                style={{
                  background: "#0d1117",
                  border: `1px solid ${BORDER}`,
                  color: "#e6edf3",
                }}
              />
            </div>
            {/* Select filtro */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm font-mono outline-none"
              style={{
                background: "#0d1117",
                border: `1px solid ${BORDER}`,
                color: "#8b949e",
              }}
            >
              <option value="all">Todos</option>
              <option value="with-reports">Con reportes</option>
              <option value="without-reports">Sin reportes</option>
              <option value="active">Activos</option>
              <option value="connected">Conectados</option>
            </select>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            className="flex items-start gap-3 px-5 py-4 rounded-xl border text-sm"
            style={{ background: "rgba(248,81,73,0.08)", borderColor: "#f851494d", color: "#ffa198" }}
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Error de conexión</p>
              <p className="text-xs mt-0.5 opacity-75">{error}</p>
            </div>
          </div>
        )}

        {/* ── Lista de agentes ── */}
        <div className="space-y-3">
          {filteredAgents.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl border"
              style={{ background: CARD, borderColor: BORDER }}
            >
              <Server size={32} style={{ color: "#30363d" }} className="mb-3" />
              <p className="text-sm" style={{ color: "#6e7681" }}>
                {searchTerm || filterType !== "all"
                  ? "Sin resultados — ajustá los filtros"
                  : "No hay agentes registrados"}
              </p>
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const isExpanded = expandedAgent === agent.UUID;
              const borderLeft = agent.Active
                ? "#238636"
                : agent.Connected
                ? "#1f6feb"
                : "#30363d";

              return (
                <div
                  key={agent.UUID}
                  className="rounded-xl border overflow-hidden"
                  style={{ background: CARD, borderColor: BORDER, borderLeft: `3px solid ${borderLeft}` }}
                >
                  {/* Fila principal */}
                  <div
                    className="px-5 py-4 cursor-pointer select-none transition-colors duration-150"
                    style={{ background: isExpanded ? "#1c2128" : "transparent" }}
                    onClick={() => handleExpandAgent(agent)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown size={15} style={{ color: "#6e7681" }} />
                        ) : (
                          <ChevronRight size={15} style={{ color: "#6e7681" }} />
                        )}

                        {/* Icono OS */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                          style={{ background: "#21262d" }}
                        >
                          {osIcon(agent.OS)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm" style={{ color: "#e6edf3" }}>
                            {agent.Hostname}
                          </h3>
                          <div className="flex items-center gap-3 text-xs font-mono mt-0.5" style={{ color: "#6e7681" }}>
                            <span className="flex items-center gap-1">
                              <Cpu size={10} /> {agent.OS}
                            </span>
                            <span className="flex items-center gap-1">
                              <Network size={10} /> {agent.IP}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {formatDate(agent.LastSeen)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        {/* Contador reportes */}
                        <div className="text-right">
                          <p className="text-xl font-bold font-mono" style={{ color: "#e6edf3" }}>
                            {agent.reportCount || 0}
                          </p>
                          <p className="text-xs" style={{ color: "#484f58" }}>Reportes</p>
                        </div>
                        <StatusPill connected={agent.Connected} active={agent.Active} />
                      </div>
                    </div>
                  </div>

                  {/* Panel expandido */}
                  {isExpanded && (
                    <div
                      className="px-5 py-5"
                      style={{ borderTop: `1px solid ${BORDER}`, background: "#0d1117" }}
                    >
                      {agent.reportCount === 0 ? (
                        <div className="flex flex-col items-center py-10" style={{ color: "#484f58" }}>
                          <FileText size={28} className="mb-3" />
                          <p className="text-sm" style={{ color: "#6e7681" }}>Sin reportes disponibles</p>
                          <p className="text-xs mt-1">Este agente no ha enviado auditorías</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
                              Auditorías{" "}
                              <span className="font-mono" style={{ color: "#6e7681" }}>
                                ({agent.reportCount})
                              </span>
                            </h4>
                            <button
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                              style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}
                            >
                              <Download size={11} />
                              Exportar
                            </button>
                          </div>

                          {agent.reports && agent.reports.length > 0 ? (
                            <>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {agent.reports.slice(0, 4).map((report, i) => (
                                  <ReportCard key={i} report={report} formatDate={formatDate} />
                                ))}
                              </div>
                              {agent.reports.length > 4 && (
                                <p className="mt-4 text-center text-xs font-medium" style={{ color: "#58a6ff" }}>
                                  Ver todos los reportes ({agent.reportCount})
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center py-8 gap-2 font-mono text-sm" style={{ color: "#6e7681" }}>
                              <RefreshCw size={14} className="animate-spin" />
                              Cargando...
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;
