import React, { useEffect, useState } from "react";

export default function AgentCard({ agent, onSelect, selected }) {
  const [_, setTimestamp] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSelect = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/console/active-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uuid: agent.id }),
      });

      if (res.ok) {
        console.log(`[+] Agente ${agent.name} seleccionado`);
        onSelect?.(agent);
      } else {
        console.error("[-] No se pudo seleccionar el agente");
      }
    } catch (err) {
      console.error("[-] Error en la solicitud:", err);
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
        selected 
          ? "border-blue-500 bg-blue-50 shadow-md" 
          : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm"
      }`}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-lg text-gray-800">{agent.name}</h4>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 rounded-full mr-1 bg-green-500"></span>
          {agent.status}
        </span>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="font-medium">OS:</span>
          <span>{agent.os}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">IP:</span>
          <span>{agent.ip}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Última vez:</span>
          <span className="text-xs">{agent.lastSeen}</span>
        </div>
      </div>
      
      {selected && (
        <div className="mt-3 text-xs text-blue-600 font-medium">
          ✓ Agente seleccionado
        </div>
      )}
    </div>
  );
}
