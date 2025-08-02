import { useEffect, useState } from "react";
import TerminalConsole from "../components/TerminalConsole";
import AgentCard from "../components/AgentCard";

export default function Consola() {
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [terminalKey, setTerminalKey] = useState(0); // Para reiniciar terminal

  useEffect(() => {
    fetch("http://127.0.0.1:5000/agents")
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);

        // Leer agente activo desde localStorage
        const savedAgentId = localStorage.getItem("activeAgentId");
        if (savedAgentId) {
          const saved = data.find((a) => a.uuid === savedAgentId);
          if (saved) setActiveAgent(saved);
        }
      })
      .catch((err) => console.error("Error cargando agentes:", err));
  }, []);

  const handleAgentSelect = (agent) => {
    setActiveAgent(agent);
    localStorage.setItem("activeAgentId", agent.id);
    setTerminalKey((prev) => prev + 1); // Reiniciar terminal para limpiar
  };

  return (
    <div className="p-6 space-y-10">
      <div>
        <h2 className="text-3xl font-semibold mb-4 text-gray-800">
          Consola {activeAgent ? `- ${activeAgent.hostname}` : ""}
        </h2>
        <TerminalConsole key={terminalKey} />
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Agentes Activos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.uuid}
              agent={{
                name: agent.hostname,
                status: "Activo",
                os: agent.os,
                lastSeen: new Date(agent.seen).toLocaleString(),
                ip: agent.ip,
                id: agent.uuid,
                hostname: agent.hostname,
              }}
              onSelect={handleAgentSelect}
              selected={activeAgent?.id === agent.uuid}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
