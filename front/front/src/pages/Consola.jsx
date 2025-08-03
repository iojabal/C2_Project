import { useState, useEffect } from "react";
import { useAgents, useConnectionStatus } from "../context/AgentContext";
import TerminalConsole from "../components/TerminalConsole"; // Importa el componente de consola
import AgentCard from "../components/AgentCard"; // Importa el componente de tarjeta de agente

export default function Consola() {
  const agents = useAgents();
  const connectionStatus = useConnectionStatus();
  const [activeAgent, setActiveAgent] = useState(null);
  const [terminalKey, setTerminalKey] = useState(0);

  const activeAgents = agents.filter(a => a.Connected && a.Active);

  // Efecto para verificar si el agente activo sigue disponible
  useEffect(() => {
    if (activeAgent) {
      const stillActive = activeAgents.find(a => a.UUID === activeAgent.UUID);
      if (!stillActive) {
        setActiveAgent(null);
        localStorage.removeItem("activeAgentId");
      }
    }
  }, [activeAgents, activeAgent]);

  // Efecto para restaurar el agente activo desde localStorage al cargar
  useEffect(() => {
    const savedAgentId = localStorage.getItem("activeAgentId");
    if (savedAgentId && activeAgents.length > 0) {
      const savedAgent = activeAgents.find(a => a.UUID === savedAgentId);
      if (savedAgent) {
        setActiveAgent(savedAgent);
      } else {
        localStorage.removeItem("activeAgentId");
      }
    }
  }, [activeAgents]);

  const handleAgentSelect = agent => {
    setActiveAgent(agent);
    localStorage.setItem("activeAgentId", agent.UUID);
    setTerminalKey(k => k + 1);
  };

  return (
    <div className="p-6 space-y-10">
      {/* Consola */}
      <div>
        <h2 className="text-3xl font-semibold mb-4 text-gray-800">
          Consola {activeAgent ? `– ${activeAgent.Hostname}` : ""}
        </h2>
        {activeAgent ? (
          <TerminalConsole key={terminalKey} agentId={activeAgent.UUID} />
        ) : (
          <div className="p-4 bg-yellow-100 rounded border border-yellow-300">
            <p className="text-yellow-800">
              {connectionStatus !== 'connected' ? (
                `WebSocket ${connectionStatus}. Verificar servidor en ws://localhost:5000/ws/agents`
              ) : activeAgents.length === 0 ? (
                "No hay agentes activos disponibles."
              ) : (
                "Selecciona un agente para abrir la consola."
              )}
            </p>
          </div>
        )}
      </div>

      {/* Agentes Activos */}
      <div>
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">
          Agentes Activos ({activeAgents.length})
        </h3>
        {activeAgents.length === 0 ? (
          <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
            <p className="text-gray-600 text-center">
              {connectionStatus !== 'connected' 
                ? `No se puede obtener agentes. Estado WebSocket: ${connectionStatus}`
                : "No hay agentes activos en este momento."
              }
            </p>
            {connectionStatus !== 'connected' && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Verifica que el servidor esté ejecutándose en ws://localhost:5000/ws/agents
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {activeAgents.map(agent => (
              <AgentCard
                key={agent.UUID}
                agent={{
                  name: agent.Hostname,
                  status: "Activo",
                  os: agent.OS,
                  lastSeen: new Date(agent.LastSeen).toLocaleString(),
                  ip: agent.IP,
                  id: agent.UUID,
                }}
                onSelect={() => handleAgentSelect(agent)}
                selected={activeAgent?.UUID === agent.UUID}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}