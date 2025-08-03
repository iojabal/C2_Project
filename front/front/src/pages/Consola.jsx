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

  // Debug logs
  useEffect(() => {
    console.log("🖥️ Consola - Total agentes:", agents.length);
    console.log("🖥️ Consola - Agentes activos:", activeAgents.length);
    console.log("🖥️ Consola - Estado conexión:", connectionStatus);
  }, [agents, activeAgents, connectionStatus]);

  // Efecto para verificar si el agente activo sigue disponible
  useEffect(() => {
    if (activeAgent) {
      const stillActive = activeAgents.find(a => a.UUID === activeAgent.UUID);
      if (!stillActive) {
        setActiveAgent(null);
        localStorage.removeItem("activeAgentId");
        console.log("🔄 Agente activo removido porque ya no está disponible");
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
        console.log("🔄 Agente restaurado desde localStorage:", savedAgent.Hostname);
      } else {
        localStorage.removeItem("activeAgentId");
        console.log("🔄 Agente guardado ya no está disponible, limpiando localStorage");
      }
    }
  }, [activeAgents]);

  const handleAgentSelect = agent => {
    setActiveAgent(agent);
    localStorage.setItem("activeAgentId", agent.UUID);
    setTerminalKey(k => k + 1);
    console.log("🎯 Agente seleccionado:", agent.Hostname);
  };

  return (
    <div className="p-6 space-y-10">
      {/* Debug info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <strong>Debug Info:</strong><br/>
        Estado WebSocket: <span className={`font-mono ${
          connectionStatus === 'connected' ? 'text-green-600' : 
          connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>{connectionStatus}</span><br/>
        Total agentes: <span className="font-mono">{agents.length}</span><br/>
        Agentes activos: <span className="font-mono">{activeAgents.length}</span>
      </div>

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


// function AgentCard({ agent, onSelect, selected }) {
//   return (
//     <div 
//       className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
//         selected 
//           ? "border-blue-500 bg-blue-50 shadow-md" 
//           : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm"
//       }`}
//       onClick={onSelect}
//     >
//       <div className="flex items-center justify-between mb-2">
//         <h4 className="font-semibold text-lg text-gray-800">{agent.name}</h4>
//         <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
//           <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
//           {agent.status}
//         </span>
//       </div>
      
//       <div className="space-y-1 text-sm text-gray-600">
//         <div className="flex justify-between">
//           <span className="font-medium">OS:</span>
//           <span>{agent.os}</span>
//         </div>
//         <div className="flex justify-between">
//           <span className="font-medium">IP:</span>
//           <span>{agent.ip}</span>
//         </div>
//         <div className="flex justify-between">
//           <span className="font-medium">Última vez:</span>
//           <span className="text-xs">{agent.lastSeen}</span>
//         </div>
//       </div>
      
//       {selected && (
//         <div className="mt-3 text-xs text-blue-600 font-medium">
//           ✓ Agente seleccionado
//         </div>
//       )}
//     </div>
//   );
// }

// function TerminalConsole({ agentId }) {
//   return (
//     <div className="bg-black text-green-400 p-4 rounded-lg font-mono">
//       <div className="mb-2">Terminal conectada al agente: {agentId}</div>
//       <div className="flex">
//         <span className="text-blue-400">user@agent:~$ </span>
//         <input 
//           type="text" 
//           className="bg-transparent border-none outline-none flex-1 text-green-400"
//           placeholder="Escribe un comando..."
//         />
//       </div>
//     </div>
//   );
// }