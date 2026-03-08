import React, { useState, useEffect } from "react";
import { useAgents } from "../context/AgentContext";
import {
  Monitor,
  Wifi,
  WifiOff,
  Activity,
  Server,
  Globe,
  Clock,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from "lucide-react";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const BG    = "#0d1117";
const CARD  = "#161b22";
const BORDER = "#21262d";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function osIcon(os = "") {
  const l = os.toLowerCase();
  if (l.includes("windows")) return { glyph: "⊞", color: "#58a6ff" };
  if (l.includes("darwin") || l.includes("mac")) return { glyph: "", color: "#d2a8ff" };
  return { glyph: "🐧", color: "#3fb950" };
}

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)  return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatusPill({ connected, active }) {
  if (connected && active)
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        ACTIVO
      </span>
    );
  if (connected)
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(88,166,255,0.15)", color: "#58a6ff", border: "1px solid rgba(88,166,255,0.3)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        CONECTADO
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(110,118,129,0.15)", color: "#6e7681", border: "1px solid rgba(110,118,129,0.3)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      OFFLINE
    </span>
  );
}

function AgentCard({ agent, pulse = false }) {
  const icon = osIcon(agent.OS);
  const borderColor = agent.Connected && agent.Active
    ? "#238636"
    : agent.Connected
    ? "#1f6feb"
    : "#30363d";

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
      style={{ background: CARD, borderColor: BORDER, borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="p-5">
        {/* Cabecera */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
              style={{ background: "#21262d" }}
            >
              {icon.glyph}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate" style={{ color: "#e6edf3" }}>
                {agent.Hostname}
              </h3>
              <p className="text-xs font-mono truncate mt-0.5" style={{ color: icon.color }}>
                {agent.OS}
              </p>
            </div>
          </div>
          <StatusPill connected={agent.Connected} active={agent.Active} />
        </div>

        {/* Datos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5" style={{ color: "#6e7681" }}>
              <Globe size={11} /> IP
            </span>
            <span className="font-mono px-2 py-0.5 rounded" style={{ color: "#e6edf3", background: "#0d1117" }}>
              {agent.IP}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5" style={{ color: "#6e7681" }}>
              <Clock size={11} /> Última vez
            </span>
            <span style={{ color: "#8b949e" }}>{relativeTime(agent.LastSeen)}</span>
          </div>
        </div>

        {/* UUID */}
        <div
          className="mt-3 px-2 py-1.5 rounded text-xs font-mono truncate"
          style={{ background: "#0d1117", color: "#484f58" }}
        >
          {agent.UUID}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border p-5 animate-pulse" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg" style={{ background: "#21262d" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 rounded" style={{ background: "#21262d" }} />
          <div className="h-2.5 w-20 rounded" style={{ background: "#21262d" }} />
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="h-2.5 w-full rounded" style={{ background: "#21262d" }} />
        <div className="h-2.5 w-3/4 rounded" style={{ background: "#21262d" }} />
        <div className="h-6 w-full rounded mt-3" style={{ background: "#21262d" }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-xl border" style={{ background: CARD, borderColor: BORDER }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: "#6e7681" }}>{label}</p>
        <p className="text-xl font-bold font-mono" style={{ color: "#e6edf3" }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const Agentes = () => {
  const agents = useAgents();
  const [allAgents, setAllAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pageSize = 6;

  const fetchAll = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/agents");
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setAllAgents(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => fetchAll(), 30000);
    return () => clearInterval(iv);
  }, []);

  const activeAgents = agents.filter((a) => a.Connected && a.Active);
  const connectedAgents = agents.filter((a) => a.Connected);
  const offlineCount = Math.max(0, allAgents.length - connectedAgents.length);
  const paginatedAgents = allAgents.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(allAgents.length / pageSize);

  return (
    <div className="min-h-full" style={{ background: BG }}>

      {/* ── Header sticky ── */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{ background: `${BG}e8`, borderColor: BORDER, backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={18} style={{ color: "#58a6ff" }} />
            <div>
              <h1 className="text-base font-bold" style={{ color: "#e6edf3" }}>
                Panel de Agentes
              </h1>
              <p className="text-xs" style={{ color: "#6e7681" }}>
                Monitoreo en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs font-mono hidden sm:block" style={{ color: "#484f58" }}>
                Actualizado {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}
            >
              <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Wifi}       label="Activos"    value={activeAgents.length}    color="#3fb950" />
          <StatCard icon={Monitor}    label="Conectados" value={connectedAgents.length}  color="#58a6ff" />
          <StatCard icon={Server}     label="Total"      value={allAgents.length}        color="#d29922" />
          <StatCard icon={WifiOff}    label="Offline"    value={offlineCount}            color="#6e7681" />
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

        {/* ── Agentes Activos (WebSocket live) ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#3fb950" }}>
              En vivo
            </h2>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)" }}
            >
              {activeAgents.length}
            </span>
          </div>

          {activeAgents.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-xl border"
              style={{ background: CARD, borderColor: BORDER }}
            >
              <WifiOff size={32} style={{ color: "#30363d" }} className="mb-3" />
              <p className="text-sm" style={{ color: "#6e7681" }}>No hay agentes activos</p>
              <p className="text-xs mt-1" style={{ color: "#484f58" }}>Los agentes en vivo aparecerán aquí</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAgents.map((a) => (
                <AgentCard key={a.UUID} agent={a} pulse />
              ))}
            </div>
          )}
        </section>

        {/* ── Historial ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={13} style={{ color: "#58a6ff" }} />
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#58a6ff" }}>
              Historial de Agentes
            </h2>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(88,166,255,0.12)", color: "#58a6ff", border: "1px solid rgba(88,166,255,0.25)" }}
            >
              {allAgents.length}
            </span>
          </div>

          {/* Skeletons */}
          {loading && allAgents.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : paginatedAgents.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-xl border"
              style={{ background: CARD, borderColor: BORDER }}
            >
              <Server size={32} style={{ color: "#30363d" }} className="mb-3" />
              <p className="text-sm" style={{ color: "#6e7681" }}>
                {error ? "Error al cargar agentes" : "No hay agentes registrados"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedAgents.map((a) => (
                  <AgentCard key={a.UUID} agent={a} />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border transition-colors disabled:opacity-30"
                    style={{ background: "#21262d", borderColor: BORDER, color: "#8b949e" }}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className="w-8 h-8 rounded-lg border text-xs font-mono font-medium transition-all"
                      style={{
                        background: page === n ? "#388bfd" : "#21262d",
                        borderColor: page === n ? "#388bfd" : BORDER,
                        color: page === n ? "#ffffff" : "#8b949e",
                      }}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border transition-colors disabled:opacity-30"
                    style={{ background: "#21262d", borderColor: BORDER, color: "#8b949e" }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Agentes;
