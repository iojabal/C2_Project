import { useState, useEffect } from "react";
import { useAgents, useConnectionStatus } from "../context/AgentContext";
import TerminalConsole from "../components/TerminalConsole";
import {
  Terminal,
  Monitor,
  Wifi,
  WifiOff,
  Clock,
  Cpu,
  Globe,
} from "lucide-react";

function AgentListItem({ agent, selected, onSelect }) {
  const osIcon = agent.OS?.toLowerCase().includes("windows") ? "⊞" : "🐧";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 font-mono text-sm group ${
        selected
          ? "bg-blue-500/10 border-blue-500/50 shadow-sm shadow-blue-500/20"
          : "bg-gray-800/40 border-gray-700/40 hover:bg-gray-700/40 hover:border-gray-600/60"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`font-semibold truncate ${
            selected ? "text-blue-300" : "text-gray-200 group-hover:text-white"
          }`}
        >
          {agent.Hostname}
        </span>
        <span className="flex items-center gap-1 text-xs text-emerald-400 shrink-0 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Globe size={10} className="shrink-0" />
          <span className="truncate text-gray-400">{agent.IP}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu size={10} className="shrink-0" />
          <span className="truncate">
            {osIcon} {agent.OS}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="shrink-0" />
          <span className="truncate">
            {new Date(agent.LastSeen).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {selected && (
        <div className="mt-2 text-xs text-blue-400 font-medium">
          ▶ Sesión activa
        </div>
      )}
    </button>
  );
}

export default function Consola() {
  const agents = useAgents();
  const connectionStatus = useConnectionStatus();
  const [activeAgent, setActiveAgent] = useState(null);
  const [terminalKey, setTerminalKey] = useState(0);

  const activeAgents = agents.filter((a) => a.Connected && a.Active);

  useEffect(() => {
    if (activeAgent) {
      const stillActive = activeAgents.find((a) => a.UUID === activeAgent.UUID);
      if (!stillActive) {
        setActiveAgent(null);
        localStorage.removeItem("activeAgentId");
      }
    }
  }, [activeAgents, activeAgent]);

  useEffect(() => {
    const savedAgentId = localStorage.getItem("activeAgentId");
    if (savedAgentId && activeAgents.length > 0) {
      const savedAgent = activeAgents.find((a) => a.UUID === savedAgentId);
      if (savedAgent) setActiveAgent(savedAgent);
      else localStorage.removeItem("activeAgentId");
    }
  }, [activeAgents]);

  const handleAgentSelect = async (agent) => {
    try {
      const res = await fetch("http://localhost:5000/api/console/active-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: agent.UUID }),
      });
      if (res.ok) {
        setActiveAgent(agent);
        localStorage.setItem("activeAgentId", agent.UUID);
        setTerminalKey((k) => k + 1);
      }
    } catch {
      // Seleccionar igualmente en el frontend
      setActiveAgent(agent);
      localStorage.setItem("activeAgentId", agent.UUID);
      setTerminalKey((k) => k + 1);
    }
  };

  const wsStatusColor =
    connectionStatus === "connected"
      ? "text-emerald-400"
      : connectionStatus === "connecting"
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "#0d1117" }}
    >
      {/* ── Panel izquierdo: lista de agentes ── */}
      <aside
        className="flex flex-col w-72 shrink-0 border-r overflow-hidden"
        style={{ borderColor: "#21262d", background: "#161b22" }}
      >
        {/* Header del panel */}
        <div
          className="px-4 py-4 border-b"
          style={{ borderColor: "#21262d" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Monitor size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-gray-200">
              Agentes Activos
            </span>
            <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {activeAgents.length}
            </span>
          </div>

          {/* WS status */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {connectionStatus === "connected" ? (
              <Wifi size={11} className={wsStatusColor} />
            ) : (
              <WifiOff size={11} className={wsStatusColor} />
            )}
            <span className={wsStatusColor}>
              WS {connectionStatus === "connected"
                ? "conectado"
                : connectionStatus === "connecting"
                ? "conectando..."
                : "desconectado"}
            </span>
          </div>
        </div>

        {/* Lista scrolleable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: "#21262d" }}
              >
                <Monitor size={20} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">
                {connectionStatus !== "connected"
                  ? "Sin conexión al servidor"
                  : "Sin agentes activos"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {connectionStatus !== "connected"
                  ? "ws://localhost:5000/ws/agents"
                  : "Esperando conexiones entrantes..."}
              </p>
            </div>
          ) : (
            activeAgents.map((agent) => (
              <AgentListItem
                key={agent.UUID}
                agent={agent}
                selected={activeAgent?.UUID === agent.UUID}
                onSelect={() => handleAgentSelect(agent)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t text-xs font-mono text-gray-600"
          style={{ borderColor: "#21262d" }}
        >
          {activeAgent ? (
            <span className="text-gray-500">
              Activo:{" "}
              <span className="text-blue-400">{activeAgent.Hostname}</span>
            </span>
          ) : (
            <span>Selecciona un agente</span>
          )}
        </div>
      </aside>

      {/* ── Panel derecho: terminal ── */}
      <main className="flex-1 flex flex-col overflow-hidden p-4" style={{ gap: "0" }}>
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <Terminal size={16} className="text-blue-400" />
          <h1 className="text-sm font-semibold text-gray-200 font-mono">
            {activeAgent
              ? `Terminal — ${activeAgent.Hostname}`
              : "Terminal"}
          </h1>
          {activeAgent && (
            <span className="text-xs font-mono text-gray-600 ml-1">
              {activeAgent.UUID}
            </span>
          )}
        </div>

        {/* Terminal o pantalla vacía */}
        <div className="flex-1 overflow-hidden">
          {activeAgent ? (
            <TerminalConsole key={terminalKey} agentId={activeAgent.UUID} />
          ) : (
            /* Empty state */
            <div
              className="h-full flex flex-col items-center justify-center rounded-lg border font-mono"
              style={{
                background: "#0d1117",
                borderColor: "#30363d",
              }}
            >
              {/* Fake terminal header */}
              <div
                className="w-full flex items-center gap-2 px-4 py-2.5 border-b mb-8 rounded-t-lg"
                style={{
                  background: "#161b22",
                  borderColor: "#30363d",
                }}
              >
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-700" />
                  <div className="w-3 h-3 rounded-full bg-gray-700" />
                  <div className="w-3 h-3 rounded-full bg-gray-700" />
                </div>
                <span className="text-xs text-gray-600 ml-2">bash — sin agente</span>
              </div>

              <div className="flex flex-col items-center text-center px-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "#1c2128", border: "1px solid #30363d" }}
                >
                  <Terminal size={28} className="text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm mb-1">
                  Ningún agente seleccionado
                </p>
                <p className="text-gray-600 text-xs">
                  Elige un agente del panel izquierdo para abrir una sesión
                </p>

                {/* Fake prompt animation */}
                <div className="mt-8 text-left">
                  <span className="text-gray-700 text-xs">
                    <span className="text-gray-600">root@agent</span>
                    <span className="text-gray-700">:~# </span>
                    <span className="inline-block w-2 h-3.5 bg-gray-700 align-middle animate-pulse" />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
