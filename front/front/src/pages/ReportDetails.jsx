import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, Network, Monitor, Database,
  Activity, AlertTriangle, Clock, Download, Copy, Eye, EyeOff,
  ChevronDown, ChevronRight, Server, Cpu, HardDrive, Wifi, Terminal,
  FileText, Camera, Maximize2, X, Hash, Link, Globe, Key, Zap,
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

/** Parsea '{"ip":"1.2.3.4","port":443}' o '1.2.3.4:443' → '1.2.3.4:443' */
function parseAddr(s) {
  if (!s) return "";
  try {
    const obj = JSON.parse(s);
    if (obj && obj.ip !== undefined) {
      const ip = obj.ip || "";
      const port = obj.port || "";
      return ip ? `${ip}:${port}` : port ? `:${port}` : "";
    }
  } catch (_) {}
  return s;
}

/** Extrae solo la IP de un addr */
function extractIP(addr) {
  const parsed = parseAddr(addr);
  return parsed.split(":")[0] || "";
}

/** RFC-1918 / loopback / link-local */
function isPrivateIP(ip) {
  if (!ip) return true;
  if (ip === "::" || ip === "0.0.0.0" || ip === "" || ip === "::1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("fe80")) return true;
  return false;
}

const SUSPICIOUS_PROC = new Set([
  "powershell.exe","powershell","pwsh.exe","pwsh",
  "cmd.exe","cmd","wscript.exe","wscript","cscript.exe","cscript",
  "mshta.exe","mshta","regsvr32.exe","regsvr32","rundll32.exe","rundll32",
  "schtasks.exe","schtasks","at.exe","at",
  "net.exe","net","netsh.exe","netsh","sc.exe",
  "certutil.exe","certutil","bitsadmin.exe","bitsadmin",
  "whoami.exe","whoami","mimikatz.exe","lsass.exe",
  "nc.exe","nc","ncat.exe","ncat","python.exe","python","python3","python3.exe",
]);

// ─── Componentes base ─────────────────────────────────────────────────────────
function Section({ icon: Icon, label, count, color = "#58a6ff", children, defaultOpen = false, badge }) {
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
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(248,81,73,0.12)", color: "#ffa198", border: "1px solid rgba(248,81,73,0.3)" }}>
              {badge}
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

function StatBadge({ label, value, color = "#e6edf3", sub }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-lg border"
      style={{ background: CARD2, borderColor: BORDER }}>
      <span className="text-xs" style={{ color: "#484f58" }}>{label}</span>
      <span className="font-bold font-mono text-lg" style={{ color }}>{value}</span>
      {sub && <span className="text-xs truncate" style={{ color: "#6e7681" }}>{sub}</span>}
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

// ─── Threat Intelligence Summary ──────────────────────────────────────────────
function ThreatSummary({ report }) {
  const connections = report.connections || [];
  const processes   = report.processes   || [];
  const files       = report.files_exfiltrated || report.filesaccessed || [];
  const persistence = report.persistence || [];

  // Conexiones externas ESTABLISHED
  const extConns = connections.filter(c => {
    if (c.status !== "ESTABLISHED") return false;
    const remoteIP = extractIP(c.remote);
    return remoteIP && !isPrivateIP(remoteIP);
  });

  // Procesos sospechosos en ejecución
  const suspProcs = processes.filter(p =>
    SUSPICIOUS_PROC.has((p.name || "").toLowerCase())
  );

  // Archivos sensibles (docx, pdf, keys)
  const sensitiveExt = [".pdf", ".doc", ".docx", ".xlsx", ".xls", ".kdbx", ".key", ".pem", ".pfx", ".p12"];
  const sensitiveFiles = files.filter(f =>
    sensitiveExt.some(ext => (f.path || "").toLowerCase().endsWith(ext))
  );

  const items = [
    extConns.length > 0 && {
      severity: "high",
      icon: Network,
      title: `${extConns.length} conexión${extConns.length > 1 ? "es" : ""} externa${extConns.length > 1 ? "s" : ""} ESTABLISHED`,
      detail: extConns.slice(0, 3).map(c => parseAddr(c.remote)).join(", "),
      color: "#f85149",
    },
    report.elevated && {
      severity: "high",
      icon: Shield,
      title: "Proceso ejecutándose con privilegios ADMIN / root",
      detail: `Usuario: ${report.user}`,
      color: "#f85149",
    },
    report.anti_debug && {
      severity: "medium",
      icon: AlertTriangle,
      title: "Técnicas anti-debugging activas",
      detail: "El sistema tiene mecanismos de detección de análisis",
      color: "#d29922",
    },
    suspProcs.length > 0 && {
      severity: "medium",
      icon: Terminal,
      title: `${suspProcs.length} proceso${suspProcs.length > 1 ? "s" : ""} sospechoso${suspProcs.length > 1 ? "s" : ""} detectado${suspProcs.length > 1 ? "s" : ""}`,
      detail: suspProcs.slice(0, 5).map(p => p.name).join(", "),
      color: "#d29922",
    },
    persistence.length > 0 && {
      severity: "medium",
      icon: Zap,
      title: `${persistence.length} mecanismo${persistence.length > 1 ? "s" : ""} de persistencia activo${persistence.length > 1 ? "s" : ""}`,
      detail: String(persistence[0] || ""),
      color: "#d29922",
    },
    sensitiveFiles.length > 0 && {
      severity: "low",
      icon: HardDrive,
      title: `${sensitiveFiles.length} archivo${sensitiveFiles.length > 1 ? "s" : ""} sensible${sensitiveFiles.length > 1 ? "s" : ""} identificado${sensitiveFiles.length > 1 ? "s" : ""}`,
      detail: sensitiveFiles.slice(0, 2).map(f => f.path?.split(/[/\\]/).pop()).join(", "),
      color: "#bc8cff",
    },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: "#f8514940" }}>
      <div className="flex items-center gap-3 px-5 py-3"
        style={{ background: "rgba(248,81,73,0.06)", borderBottom: `1px solid #f8514930` }}>
        <AlertTriangle size={14} style={{ color: "#f85149" }} />
        <span className="text-sm font-semibold" style={{ color: "#ffa198" }}>
          Hallazgos de Seguridad ({items.length})
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: BORDER }}>
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3">
            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${item.color}15` }}>
              <item.icon size={12} style={{ color: item.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{item.title}</p>
              {item.detail && (
                <p className="text-xs font-mono mt-0.5 truncate" style={{ color: "#6e7681" }}>{item.detail}</p>
              )}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: `${item.color}15`,
                color: item.color,
                border: `1px solid ${item.color}30`,
              }}>
              {item.severity === "high" ? "ALTO" : item.severity === "medium" ? "MEDIO" : "INFO"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tabla de Procesos ────────────────────────────────────────────────────────
function ProcessTable({ processes }) {
  const [sortBy, setSortBy]     = useState("cpu");
  const [showAll, setShowAll]   = useState(false);
  const [filterSusp, setFilter] = useState(false);

  if (!processes?.length) return <EmptyState msg="Sin procesos registrados" />;

  let list = [...processes];
  if (filterSusp) list = list.filter(p => SUSPICIOUS_PROC.has((p.name || "").toLowerCase()));

  const sorted = list.sort((a, b) => {
    if (sortBy === "cpu")  return b.cpu - a.cpu;
    if (sortBy === "mem")  return b.memory - a.memory;
    if (sortBy === "pid")  return a.pid - b.pid;
    return (a.name || "").localeCompare(b.name || "");
  });

  const visible = showAll ? sorted : sorted.slice(0, 50);
  const maxCpu  = Math.max(...processes.map(p => p.cpu || 0), 1);
  const maxMem  = Math.max(...processes.map(p => p.memory || 0), 1);
  const suspCount = processes.filter(p => SUSPICIOUS_PROC.has((p.name || "").toLowerCase())).length;

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2 flex-wrap"
        style={{ background: CARD2, borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={() => setFilter(f => !f)}
          className="text-xs px-2.5 py-1 rounded-md transition-colors"
          style={{
            background: filterSusp ? "rgba(248,81,73,0.15)" : BORDER,
            color: filterSusp ? "#ffa198" : "#6e7681",
            border: `1px solid ${filterSusp ? "#f8514940" : BORDER}`,
          }}>
          ⚠ Sospechosos ({suspCount})
        </button>
        <span className="text-xs" style={{ color: "#484f58" }}>
          {list.length} proceso{list.length !== 1 ? "s" : ""} · ordenar por:
        </span>
        {[["cpu","CPU"],["mem","Mem"],["pid","PID"],["name","Nombre"]].map(([k,l]) => (
          <button key={k} onClick={() => setSortBy(k)}
            className="text-xs px-2 py-0.5 rounded transition-colors"
            style={{ color: sortBy === k ? "#58a6ff" : "#6e7681", fontWeight: sortBy === k ? 600 : 400 }}>
            {l}{sortBy === k ? " ↓" : ""}
          </button>
        ))}
      </div>
      <div className="overflow-auto max-h-96">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "#0d1117" }}>
              <th className="px-4 py-2 text-left" style={{ color: "#6e7681" }}>PID</th>
              <th className="px-4 py-2 text-left" style={{ color: "#6e7681" }}>Nombre</th>
              <th className="px-4 py-2 text-left" style={{ color: "#6e7681" }}>CPU %</th>
              <th className="px-4 py-2 text-left" style={{ color: "#6e7681" }}>Mem %</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p, i) => {
              const susp = SUSPICIOUS_PROC.has((p.name || "").toLowerCase());
              return (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors"
                  style={{
                    borderBottom: `1px solid ${BORDER}20`,
                    background: susp ? "rgba(248,81,73,0.04)" : "transparent",
                  }}>
                  <td className="px-4 py-1.5" style={{ color: "#6e7681" }}>{p.pid}</td>
                  <td className="px-4 py-1.5 max-w-[200px] truncate">
                    <div className="flex items-center gap-1.5">
                      {susp && <AlertTriangle size={10} style={{ color: "#f85149", shrink: 0 }} />}
                      <span style={{ color: susp ? "#ffa198" : "#e6edf3" }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
                        <div className="h-full rounded-full"
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
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
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
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length > 50 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs py-2.5 transition-colors hover:bg-white/[0.02]"
          style={{ color: "#58a6ff", borderTop: `1px solid ${BORDER}` }}>
          Ver todos ({sorted.length - 50} más)
        </button>
      )}
    </div>
  );
}

// ─── Tabla de Conexiones ──────────────────────────────────────────────────────
function ConnectionTable({ connections }) {
  const [filter, setFilter] = useState("all");
  if (!connections?.length) return <EmptyState msg="Sin conexiones registradas" />;

  const statusColor = s => {
    if (s === "ESTABLISHED") return "#3fb950";
    if (s === "LISTEN")      return "#58a6ff";
    if (s === "TIME_WAIT")   return "#d29922";
    if (s === "CLOSE_WAIT")  return "#f85149";
    return "#6e7681";
  };

  const est   = connections.filter(c => c.status === "ESTABLISHED").length;
  const lis   = connections.filter(c => c.status === "LISTEN").length;
  const extEst = connections.filter(c => {
    if (c.status !== "ESTABLISHED") return false;
    return !isPrivateIP(extractIP(c.remote));
  });

  const filtered = filter === "all"     ? connections
    : filter === "established" ? connections.filter(c => c.status === "ESTABLISHED")
    : filter === "external"    ? extEst
    : connections.filter(c => c.status === "LISTEN");

  return (
    <div>
      <div className="flex items-center gap-4 px-5 py-2.5 flex-wrap"
        style={{ borderBottom: `1px solid ${BORDER}`, background: CARD2 }}>
        <span style={{ color: "#3fb950" }} className="text-xs font-mono">● {est} ESTABLISHED</span>
        <span style={{ color: "#58a6ff" }} className="text-xs font-mono">● {lis} LISTEN</span>
        <span style={{ color: "#f85149" }} className="text-xs font-mono">● {extEst.length} externas</span>
        <div className="flex gap-1.5 ml-auto">
          {[["all","Todo"],["established","ESTABLISHED"],["external","Solo externas"],["listen","LISTEN"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className="text-xs px-2.5 py-0.5 rounded-md transition-colors"
              style={{
                background: filter === v ? "#21262d" : "transparent",
                color: filter === v ? "#e6edf3" : "#6e7681",
                border: `1px solid ${filter === v ? BORDER : "transparent"}`,
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto max-h-80">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: "#0d1117" }}>
              {["Proto","Local","Remoto","Estado"].map(h => (
                <th key={h} className="px-4 py-2 text-left" style={{ color: "#6e7681" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const remoteIP  = extractIP(c.remote);
              const isExt     = !isPrivateIP(remoteIP) && remoteIP;
              const local     = parseAddr(c.local)  || "—";
              const remote    = parseAddr(c.remote) || "—";
              return (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors"
                  style={{
                    borderBottom: `1px solid ${BORDER}20`,
                    background: isExt && c.status === "ESTABLISHED" ? "rgba(248,81,73,0.04)" : "transparent",
                  }}>
                  <td className="px-4 py-1.5">
                    <span className="px-1.5 py-0.5 rounded uppercase"
                      style={{ background: "#21262d", color: "#79c0ff" }}>
                      {c.protocol}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 truncate max-w-[160px]" style={{ color: "#8b949e" }}>
                    {local}
                  </td>
                  <td className="px-4 py-1.5 truncate max-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      {isExt && <Globe size={10} style={{ color: "#f85149", shrink: 0 }} />}
                      <span style={{ color: isExt ? "#ffa198" : remote !== "—" ? "#e6edf3" : "#484f58" }}>
                        {remote}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5" style={{ color: statusColor(c.status) }}>
                    {c.status || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Historial de comandos ────────────────────────────────────────────────────
function CommandHistory({ commands }) {
  if (!commands?.length) return <EmptyState msg="Sin historial de comandos" sub="No se encontró PSReadLine history" />;
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

// ─── Archivos ─────────────────────────────────────────────────────────────────
function FileList({ files }) {
  const [showAll, setShowAll] = useState(false);
  if (!files?.length) return <EmptyState msg="Sin archivos registrados" />;

  const extColor = ext => ({
    ".pdf":  "#f85149", ".doc": "#58a6ff", ".docx": "#58a6ff",
    ".xlsx": "#3fb950", ".xls": "#3fb950", ".txt":  "#6e7681",
    ".kdbx": "#bc8cff", ".pem": "#d29922", ".key":  "#d29922",
    ".pfx":  "#d29922", ".p12": "#d29922",
  }[ext] || "#484f58");

  const visible = showAll ? files : files.slice(0, 30);

  return (
    <div>
      <div className="overflow-auto max-h-96">
        {visible.map((f, i) => {
          const parts = (f.path || "").replace(/\\/g, "/").split("/");
          const name  = parts.pop() || f.path;
          const dir   = parts.join("/") || "";
          const ext   = ("." + name.split(".").pop()).toLowerCase();
          const color = extColor(ext);
          return (
            <div key={i} className="flex items-start gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < visible.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <span className="shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded mt-0.5"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25`, minWidth: "40px", textAlign: "center" }}>
                {ext.slice(1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-mono font-semibold truncate" style={{ color: "#e6edf3" }}>{name}</p>
                <p className="text-xs font-mono mt-0.5 truncate" style={{ color: "#484f58" }}>{dir}</p>
                <p className="text-xs font-mono mt-0.5 break-all" style={{ color: "#30363d" }}>
                  {f.sha256 || f.hash || "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {files.length > 30 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-xs py-2.5 transition-colors hover:bg-white/[0.02]"
          style={{ color: "#58a6ff", borderTop: `1px solid ${BORDER}` }}>
          Ver todos ({files.length - 30} más)
        </button>
      )}
    </div>
  );
}

// ─── Persistencia ─────────────────────────────────────────────────────────────
function PersistenceList({ items }) {
  if (!items?.length) return <EmptyState msg="Sin mecanismos de persistencia detectados" />;
  return (
    <div className="p-4 space-y-2">
      {items.map((item, i) => {
        const text     = typeof item === "string" ? item : JSON.stringify(item);
        const colonIdx = text.indexOf(":");
        const prefix   = colonIdx > -1 ? text.slice(0, colonIdx) : text;
        const rest     = colonIdx > -1 ? text.slice(colonIdx + 1).trim() : "";
        const tl       = text.toLowerCase();
        const color    =
          tl.includes("runkey") || tl.includes("run") ? "#d29922" :
          tl.includes("startup")                       ? "#f85149" :
          tl.includes("cron") || tl.includes("bashrc") ? "#bc8cff" :
          tl.includes("systemd")                       ? "#ff7b72" : "#58a6ff";
        return (
          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ background: `${color}0d`, border: `1px solid ${color}25` }}>
            <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color }} />
            <div className="font-mono text-xs min-w-0 flex-1">
              <span className="font-semibold" style={{ color }}>{prefix}:</span>
              <span className="break-all ml-1" style={{ color: "#c9d1d9" }}>{rest}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── IPs / DNS ────────────────────────────────────────────────────────────────
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

// ─── Screenshot ───────────────────────────────────────────────────────────────
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

// ─── Blockchain ────────────────────────────────────────────────────────────────
function BlockchainInfo({ report }) {
  const { sequence, prev_hash, hash } = report;
  return (
    <div className="p-5 space-y-3">
      {[
        { label: "Secuencia",     value: `#${sequence ?? "—"}`, icon: Hash, color: "#58a6ff", mono: false },
        { label: "Hash bloque",   value: hash || "—",           icon: Key,  color: "#3fb950", mono: true  },
        { label: "Hash anterior", value: prev_hash || "genesis",icon: Link, color: "#6e7681", mono: true  },
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
  const { id }   = useParams();
  const navigate = useNavigate();
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
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

  const r     = report;
  const cmds  = r.commands_executed || r.commandsrun || [];
  const files = r.files_exfiltrated || r.filesaccessed || [];

  const extConns = (r.connections || []).filter(c => {
    if (c.status !== "ESTABLISHED") return false;
    return !isPrivateIP(extractIP(c.remote));
  });

  const suspProcs = (r.processes || []).filter(p =>
    SUSPICIOUS_PROC.has((p.name || "").toLowerCase())
  );

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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm font-bold" style={{ color: "#e6edf3" }}>{r.hostname}</h1>
                {r.elevated && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(248,81,73,0.15)", color: "#f85149", border: "1px solid rgba(248,81,73,0.3)" }}>
                    ADMIN
                  </span>
                )}
                {r.anti_debug && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(210,153,34,0.15)", color: "#d29922", border: "1px solid rgba(210,153,34,0.3)" }}>
                    ANTI-DEBUG
                  </span>
                )}
                {extConns.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(248,81,73,0.1)", color: "#ffa198", border: "1px solid rgba(248,81,73,0.25)" }}>
                    {extConns.length} EXT C2
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
            <button onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#238636", color: "#ffffff" }}>
              <Download size={11} /> JSON
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

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
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(r, null, 2))}
                style={{ color: "#484f58" }} className="hover:text-blue-400 transition-colors">
                <Copy size={11} />
              </button>
            </div>
            <pre className="p-4 overflow-auto max-h-80 text-xs font-mono"
              style={{ background: "#0d1117", color: "#3fb950" }}>
              {JSON.stringify(r, null, 2)}
            </pre>
          </div>
        )}

        {/* ── Threat Intelligence ── */}
        <ThreatSummary report={r} />

        {/* ── Stats overview ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <StatBadge label="Usuario"    value={r.user?.split("\\").pop() || "N/A"} sub={r.user} color={r.elevated ? "#f85149" : "#e6edf3"} />
          <StatBadge label="Arq."       value={r.arch || "—"} />
          <StatBadge label="Procesos"   value={r.processes?.length ?? 0}   color={suspProcs.length > 0 ? "#d29922" : "#e6edf3"} sub={suspProcs.length > 0 ? `⚠ ${suspProcs.length} sospechosos` : undefined} />
          <StatBadge label="Conexiones" value={r.connections?.length ?? 0} color={extConns.length > 0  ? "#f85149" : "#e6edf3"} sub={extConns.length > 0  ? `⚠ ${extConns.length} externas`    : undefined} />
          <StatBadge label="Comandos"   value={cmds.length}   color={cmds.length   > 0 ? "#bc8cff" : "#6e7681"} />
          <StatBadge label="Archivos"   value={files.length}  color={files.length  > 0 ? "#ffa198" : "#6e7681"} />
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
              { icon: Network,  label: "Gateway",    value: r.gateway || "—",                          color: "#d29922" },
              { icon: Clock,    label: "First seen",  value: formatDate(r.firstseen || r.first_seen),  color: "#6e7681" },
              { icon: Activity, label: "Last seen",   value: formatDate(r.last_seen  || r.lastseen),   color: "#6e7681" },
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
        <Section icon={Camera}    label="Captura de Pantalla"        color="#bc8cff">
          <ScreenshotSection agentId={r.agent_id} hostname={r.hostname} lastSeen={r.last_seen} />
        </Section>

        <Section icon={Cpu}    label="Procesos Activos"           color={suspProcs.length > 0 ? "#d29922" : "#58a6ff"}
          count={r.processes?.length}
          badge={suspProcs.length > 0 ? `⚠ ${suspProcs.length} sospechosos` : undefined}
          defaultOpen={suspProcs.length > 0}>
          <ProcessTable processes={r.processes} />
        </Section>

        <Section icon={Network}   label="Conexiones de Red"          color={extConns.length > 0 ? "#f85149" : "#3fb950"}
          count={r.connections?.length}
          badge={extConns.length > 0 ? `⚠ ${extConns.length} externas` : undefined}
          defaultOpen={extConns.length > 0}>
          <ConnectionTable connections={r.connections} />
        </Section>

        <Section icon={Shield}    label="Mecanismos de Persistencia" color="#d29922"
          count={r.persistence?.length}
          defaultOpen={(r.persistence?.length || 0) > 0}>
          <PersistenceList items={r.persistence} />
        </Section>

        <Section icon={Terminal}  label="Historial de Comandos"      color="#bc8cff"
          count={cmds.length}
          defaultOpen={cmds.length > 0}>
          <CommandHistory commands={cmds} />
        </Section>

        <Section icon={HardDrive} label="Archivos Sensibles"         color="#f85149"
          count={files.length}
          defaultOpen={files.length > 0}>
          <FileList files={files} />
        </Section>

        {r.hash && (
          <Section icon={Hash} label="Integridad del Registro" color="#3fb950" defaultOpen>
            <BlockchainInfo report={r} />
          </Section>
        )}
      </div>
    </div>
  );
}
