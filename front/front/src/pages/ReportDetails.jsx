import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, Network, Monitor, Database,
  Activity, AlertTriangle, Clock, Download, Copy, Eye, EyeOff,
  ChevronDown, ChevronRight, Server, Cpu, HardDrive, Wifi, Terminal,
  FileText, Camera, Maximize2, X, Hash, Link, Globe, Key,
} from "lucide-react";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const BG     = "#0d1117";
const CARD   = "#161b22";
const CARD2  = "#1c2128";
const BORDER = "#21262d";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(s) {
  if (!s) return "—";
  try {
    const d = s.includes("T")
      ? new Date(s)
      : new Date(s.split(" ").slice(0, 2).join(" ").replace(/\.\d+/, ""));
    if (isNaN(d)) return "—";
    return d.toLocaleString("es-ES", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

// ─── Componentes base ─────────────────────────────────────────────────────────
function Section({ icon: Icon, label, count, color = "#58a6ff", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: "#e6edf3" }}>{label}</span>
          {count !== undefined && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
              {count}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown size={14} style={{ color: "#6e7681" }} />
          : <ChevronRight size={14} style={{ color: "#6e7681" }} />}
      </button>
      {open && <div style={{ borderTop: `1px solid ${BORDER}` }}>{children}</div>}
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-lg border"
      style={{ background: CARD2, borderColor: BORDER }}>
      <span className="text-xs" style={{ color: "#484f58" }}>{label}</span>
      <span className="font-bold font-mono text-lg" style={{ color: "#e6edf3" }}>{value}</span>
    </div>
  );
}

function EmptyState({ msg, sub, icon: Icon = Database }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <Icon size={24} style={{ color: "#30363d" }} />
      <p className="text-sm" style={{ color: "#6e7681" }}>{msg}</p>
      {sub && <p className="text-xs font-mono" style={{ color: "#484f58" }}>{sub}</p>}
    </div>
  );
}

// ─── Tabla de Procesos ────────────────────────────────────────────────────────
function ProcessTable({ processes }) {
  const [sortBy, setSortBy] = useState("cpu");
  if (!processes?.length) return <EmptyState msg="Sin procesos registrados" />;

  const sorted = [...processes].sort((a, b) => {
    if (sortBy === "cpu")  return b.cpu - a.cpu;
    if (sortBy === "mem")  return b.memory - a.memory;
    if (sortBy === "pid")  return a.pid - b.pid;
    return (a.name || "").localeCompare(b.name || "");
  });

  const maxCpu = Math.max(...processes.map(p => p.cpu || 0), 1);
  const maxMem = Math.max(...processes.map(p => p.memory || 0), 1);

  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}`, background: CARD2 }}>
            {[
              { key: "pid",  label: "PID"    },
              { key: "name", label: "Nombre" },
              { key: "cpu",  label: "CPU %"  },
              { key: "mem",  label: "Mem %"  },
            ].map(({ key, label }) => (
              <th key={key}
                onClick={() => setSortBy(key)}
                className="px-4 py-2 text-left cursor-pointer select-none"
                style={{ color: sortBy === key ? "#58a6ff" : "#6e7681" }}>
                {label} {sortBy === key && "↓"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 200).map((p, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: `1px solid ${BORDER}20` }}>
              <td className="px-4 py-2" style={{ color: "#6e7681" }}>{p.pid}</td>
              <td className="px-4 py-2 max-w-xs truncate" style={{ color: "#e6edf3" }}>{p.name}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(((p.cpu || 0) / maxCpu) * 100, 100)}%`,
                        background: (p.cpu || 0) > 50 ? "#f85149" : "#3fb950",
                      }} />
                  </div>
                  <span style={{ color: (p.cpu || 0) > 50 ? "#ff7b72" : "#8b949e" }}>
                    {(p.cpu || 0).toFixed(1)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${Math.min(((p.memory || 0) / maxMem) * 100, 100)}%`,
                        background: "#58a6ff",
                      }} />
                  </div>
                  <span style={{ color: "#8b949e" }}>{(p.memory || 0).toFixed(1)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {processes.length > 200 && (
        <p className="text-center text-xs py-2" style={{ color: "#484f58" }}>
          Mostrando 200 de {processes.length}
        </p>
      )}
    </div>
  );
}

// ─── Tabla de Conexiones ──────────────────────────────────────────────────────
function ConnectionTable({ connections }) {
  if (!connections?.length) return <EmptyState msg="Sin conexiones registradas" />;

  const statusColor = s => {
    if (s === "ESTABLISHED") return "#3fb950";
    if (s === "LISTEN")      return "#58a6ff";
    if (s === "TIME_WAIT")   return "#d29922";
    return "#6e7681";
  };

  const est = connections.filter(c => c.status === "ESTABLISHED").length;
  const lis = connections.filter(c => c.status === "LISTEN").length;

  return (
    <div>
      <div className="flex gap-4 px-5 py-2.5 text-xs font-mono"
        style={{ borderBottom: `1px solid ${BORDER}`, background: CARD2 }}>
        <span style={{ color: "#3fb950" }}>● {est} ESTABLISHED</span>
        <span style={{ color: "#58a6ff" }}>● {lis} LISTEN</span>
        <span style={{ color: "#6e7681" }}>● {connections.length - est - lis} otros</span>
      </div>
      <div className="overflow-auto max-h-72">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "#0d1117" }}>
              {["Proto", "Local", "Remoto", "Estado"].map(h => (
                <th key={h} className="px-4 py-2 text-left" style={{ color: "#6e7681" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {connections.map((c, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors"
                style={{ borderBottom: `1px solid ${BORDER}20` }}>
                <td className="px-4 py-1.5">
                  <span className="px-1.5 py-0.5 rounded uppercase"
                    style={{ background: "#21262d", color: "#79c0ff" }}>
                    {c.protocol}
                  </span>
                </td>
                <td className="px-4 py-1.5 truncate max-w-[160px]" style={{ color: "#8b949e" }}>
                  {c.local || "—"}
                </td>
                <td className="px-4 py-1.5 truncate max-w-[160px]"
                  style={{ color: c.remote ? "#e6edf3" : "#484f58" }}>
                  {c.remote || "—"}
                </td>
                <td className="px-4 py-1.5" style={{ color: statusColor(c.status) }}>
                  {c.status || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Historial de comandos ────────────────────────────────────────────────────
function CommandHistory({ commands }) {
  if (!commands?.length) return <EmptyState msg="Sin historial de comandos" />;
  return (
    <div className="p-4 overflow-auto max-h-80"
      style={{ background: "#0d1117", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {commands.map((cmd, i) => (
        <div key={i} className="flex items-start gap-2 py-0.5">
          <span className="shrink-0 select-none text-sm" style={{ color: "#3fb950" }}>
            {String(i + 1).padStart(3, " ")} $
          </span>
          <span className="text-sm break-all" style={{ color: "#c9d1d9" }}>{cmd}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Archivos ────────────────────────────────────────────────────────────────
function FileList({ files }) {
  if (!files?.length) return <EmptyState msg="Sin archivos registrados" />;
  return (
    <div>
      {files.map((f, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
          style={{ borderBottom: i < files.length - 1 ? `1px solid ${BORDER}` : "none" }}>
          <HardDrive size={13} className="mt-0.5 shrink-0" style={{ color: "#f85149" }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-mono truncate" style={{ color: "#e6edf3" }}>{f.path}</p>
            <p className="text-xs font-mono mt-0.5 break-all" style={{ color: "#484f58" }}>
              SHA256: {f.sha256 || f.hash || "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Persistencia ────────────────────────────────────────────────────────────
function PersistenceList({ items }) {
  if (!items?.length) return <EmptyState msg="Sin mecanismos de persistencia detectados" />;
  return (
    <div className="p-4 space-y-2">
      {items.map((item, i) => {
        const text = typeof item === "string" ? item : JSON.stringify(item);
        const colonIdx = text.indexOf(":");
        const prefix = colonIdx > -1 ? text.slice(0, colonIdx) : text;
        const rest   = colonIdx > -1 ? text.slice(colonIdx + 1) : "";
        const tl = text.toLowerCase();
        const color =
          tl.includes("runkey") || tl.includes("run") ? "#d29922" :
          tl.includes("startup")                       ? "#f85149" :
          tl.includes("cron") || tl.includes("bashrc") ? "#bc8cff" : "#58a6ff";
        return (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ background: `${color}0d`, border: `1px solid ${color}25` }}>
            <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color }} />
            <div className="font-mono text-xs min-w-0">
              <span className="font-semibold" style={{ color }}>{prefix}:</span>
              <span className="break-all" style={{ color: "#c9d1d9" }}>{rest}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── IPs / DNS como chips ─────────────────────────────────────────────────────
function ChipList({ items, color = "#58a6ff" }) {
  if (!items?.length) return <EmptyState msg="Sin datos" />;
  return (
    <div className="flex flex-wrap gap-2 px-5 py-4">
      {items.map((item, i) => (
        <span key={i} className="px-3 py-1 rounded-full text-xs font-mono"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── Screenshot ──────────────────────────────────────────────────────────────
function ScreenshotSection({ agentId, hostname, lastSeen }) {
  const [loaded, setLoaded] = useState(false);
  const [err,    setErr]    = useState(false);
  const [modal,  setModal]  = useState(false);
  const url = agentId ? `http://localhost:5000/tmp/${agentId}.png` : null;

  if (!url) return <EmptyState msg="Agent ID no disponible" />;

  return (
    <div className="p-4">
      {err ? (
        <EmptyState msg="Captura no disponible" sub={`${agentId}.png`} icon={Camera} />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden cursor-pointer group"
            style={{ background: "#0d1117", border: `1px solid ${BORDER}` }}
            onClick={() => loaded && setModal(true)}>
            <img src={url} alt="screenshot"
              className="w-full object-contain max-h-64"
              onLoad={() => setLoaded(true)}
              onError={() => setErr(true)}
              style={{ display: loaded ? "block" : "none" }} />
            {!loaded && !err && (
              <div className="flex items-center justify-center h-32">
                <Camera size={24} style={{ color: "#484f58" }} />
              </div>
            )}
            {loaded && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <Maximize2 size={20} className="opacity-0 group-hover:opacity-100 transition-opacity text-white" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: "#6e7681" }}>
            <span>{hostname} · {formatDate(lastSeen)}</span>
            <a href={url} download={`screenshot_${agentId}.png`}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors">
              <Download size={11} /> Descargar
            </a>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setModal(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <img src={url} alt="fullscreen" className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Blockchain ───────────────────────────────────────────────────────────────
function BlockchainInfo({ report }) {
  const { sequence, prev_hash, hash } = report;
  return (
    <div className="p-5 space-y-3">
      {[
        { label: "Secuencia",     value: `#${sequence ?? "—"}`,          icon: Hash, color: "#58a6ff", mono: false },
        { label: "Hash bloque",   value: hash || "—",                     icon: Key,  color: "#3fb950", mono: true  },
        { label: "Hash anterior", value: prev_hash || "genesis",          icon: Link, color: "#6e7681", mono: true  },
      ].map(({ label, value, icon: Icon, color, mono }) => (
        <div key={label} className="flex items-start gap-3">
          <Icon size={13} className="mt-0.5 shrink-0" style={{ color }} />
          <div className="min-w-0 flex-1">
            <p className="text-xs" style={{ color: "#484f58" }}>{label}</p>
            <p className={`text-sm truncate ${mono ? "font-mono" : "font-semibold"}`} style={{ color: "#e6edf3" }}>
              {value}
            </p>
          </div>
          {mono && value !== "genesis" && (
            <button className="shrink-0 hover:text-blue-400 transition-colors" style={{ color: "#484f58" }}
              onClick={() => navigator.clipboard.writeText(value)}>
              <Copy size={11} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReportDetail() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => { fetchReport(); }, [id]);

  const fetchReport = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/reports/${id}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setReport(data.data);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false);  }
  };

  // ── Estados de carga ──
  if (loading) return (
    <div className="flex items-center justify-center h-full" style={{ background: BG }}>
      <div className="flex items-center gap-3 font-mono text-sm" style={{ color: "#6e7681" }}>
        <Database size={16} className="animate-pulse" style={{ color: "#58a6ff" }} />
        Cargando reporte...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ background: BG }}>
      <AlertTriangle size={32} style={{ color: "#f85149" }} />
      <p className="text-sm" style={{ color: "#ffa198" }}>{error}</p>
      <button onClick={() => navigate(-1)}
        className="px-4 py-2 rounded-lg text-sm"
        style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}>
        Volver
      </button>
    </div>
  );

  if (!report) return (
    <div className="flex items-center justify-center h-full" style={{ background: BG }}>
      <EmptyState msg="Reporte no encontrado" icon={FileText} />
    </div>
  );

  const r = report;
  const cmds = r.commands_executed || r.commandsrun || [];
  const files = r.files_exfiltrated || r.filesaccessed || [];

  const downloadJson = () => {
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(r, null, 2));
    a.download = `report_${r.hostname}_${id}.json`;
    a.click();
  };

  return (
    <div className="min-h-full" style={{ background: BG }}>

      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-10 px-6 py-3 border-b"
        style={{ background: `${BG}f0`, borderColor: BORDER, backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "#6e7681" }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold" style={{ color: "#e6edf3" }}>{r.hostname}</h1>
                {r.elevated && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(210,153,34,0.15)", color: "#d29922", border: "1px solid rgba(210,153,34,0.3)" }}>
                    ADMIN
                  </span>
                )}
                {r.anti_debug && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(248,81,73,0.12)", color: "#ffa198", border: "1px solid rgba(248,81,73,0.3)" }}>
                    ANTI-DEBUG
                  </span>
                )}
              </div>
              <p className="text-xs font-mono" style={{ color: "#6e7681" }}>
                {r.os} {r.arch} · {r.user} · {formatDate(r.last_seen || r.lastseen)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowJson(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}>
              {showJson ? <EyeOff size={11} /> : <Eye size={11} />} Raw JSON
            </button>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(r, null, 2))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}>
              <Copy size={11} /> Copiar
            </button>
            <button onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#238636", color: "#ffffff" }}>
              <Download size={11} /> JSON
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* ── Alertas críticas ── */}
        {(r.anti_debug || r.elevated) && (
          <div className="flex flex-wrap gap-3">
            {r.anti_debug && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium"
                style={{ background: "rgba(248,81,73,0.08)", borderColor: "#f851494d", color: "#ffa198" }}>
                <AlertTriangle size={14} /> Anti-debug detectado en este sistema
              </div>
            )}
            {r.elevated && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium"
                style={{ background: "rgba(210,153,34,0.1)", borderColor: "rgba(210,153,34,0.3)", color: "#d29922" }}>
                <Shield size={14} /> Proceso con privilegios elevados (ADMIN / root)
              </div>
            )}
          </div>
        )}

        {/* ── JSON raw ── */}
        {showJson && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between px-4 py-2"
              style={{ background: CARD2, borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex gap-1.5">
                {["#ef4444","#eab308","#22c55e"].map(c => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.6 }} />
                ))}
              </div>
              <span className="text-xs font-mono" style={{ color: "#6e7681" }}>report.json</span>
              <div />
            </div>
            <pre className="p-4 overflow-auto max-h-80 text-xs font-mono"
              style={{ background: "#0d1117", color: "#3fb950" }}>
              {JSON.stringify(r, null, 2)}
            </pre>
          </div>
        )}

        {/* ── Stats overview ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <StatBadge label="Usuario"    value={r.user || "N/A"} />
          <StatBadge label="Arq."       value={r.arch || "—"} />
          <StatBadge label="Procesos"   value={r.processes?.length ?? 0} />
          <StatBadge label="Conexiones" value={r.connections?.length ?? 0} />
          <StatBadge label="Comandos"   value={cmds.length} />
          <StatBadge label="Archivos"   value={files.length} />
        </div>

        {/* ── Red: IPs, DNS, Gateway ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Globe size={13} style={{ color: "#58a6ff" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#58a6ff" }}>
                IPs ({r.ips?.length ?? 0})
              </span>
            </div>
            <ChipList items={r.ips} color="#58a6ff" />
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <Server size={13} style={{ color: "#3fb950" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#3fb950" }}>
                DNS ({r.dns?.length ?? 0})
              </span>
            </div>
            <ChipList items={r.dns} color="#3fb950" />
          </div>

          <div className="rounded-xl border p-4 space-y-3" style={{ background: CARD, borderColor: BORDER }}>
            {[
              { icon: Network,  label: "Gateway",    value: r.gateway || "—",                             color: "#d29922" },
              { icon: Clock,    label: "First seen",  value: formatDate(r.firstseen || r.first_seen),    color: "#6e7681" },
              { icon: Activity, label: "Last seen",   value: formatDate(r.last_seen  || r.lastseen),      color: "#6e7681" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-start gap-2 text-xs">
                <Icon size={12} className="mt-0.5 shrink-0" style={{ color }} />
                <div>
                  <p style={{ color: "#484f58" }}>{label}</p>
                  <p className="font-mono" style={{ color: "#e6edf3" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Secciones expandibles ── */}
        <Section icon={Camera}    label="Captura de Pantalla"       color="#bc8cff">
          <ScreenshotSection agentId={r.agent_id} hostname={r.hostname} lastSeen={r.last_seen} />
        </Section>

        <Section icon={Cpu}       label="Procesos Activos"          color="#58a6ff" count={r.processes?.length}>
          <ProcessTable processes={r.processes} />
        </Section>

        <Section icon={Network}   label="Conexiones de Red"         color="#3fb950" count={r.connections?.length}>
          <ConnectionTable connections={r.connections} />
        </Section>

        <Section icon={Shield}    label="Mecanismos de Persistencia" color="#d29922" count={r.persistence?.length}>
          <PersistenceList items={r.persistence} />
        </Section>

        <Section icon={Terminal}  label="Historial de Comandos"     color="#bc8cff" count={cmds.length}>
          <CommandHistory commands={cmds} />
        </Section>

        <Section icon={HardDrive} label="Archivos Exfiltrados"      color="#f85149" count={files.length}>
          <FileList files={files} />
        </Section>

        {r.hash && (
          <Section icon={Hash} label="Integridad del Registro" color="#3fb950">
            <BlockchainInfo report={r} />
          </Section>
        )}
      </div>
    </div>
  );
}
