import React, { useEffect, useState } from "react";

const AgentCard = ({ agent, onSelect, selected }) => {
  const [timestamp, setTimestamp] = useState(Date.now());

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
        onSelect?.(agent); // Notifica al padre
      } else {
        console.error("[-] No se pudo seleccionar el agente");
      }
    } catch (err) {
      console.error("[-] Error en la solicitud:", err);
    }
  };

  const screenshotUrl = `http://localhost:5000/tmp/${agent.id}.png?t=${timestamp}`;

  return (
    <div
      onClick={handleSelect}
      className={`cursor-pointer bg-white rounded-xl shadow-md overflow-hidden w-full mt-6 max-w-xl mx-auto border ${
        selected ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200"
      } transition-all duration-200 hover:shadow-lg`}
    >
      <img
        src={screenshotUrl}
        alt={`Captura de ${agent.name}`}
        className="w-full h-60 object-cover border-b"
      />
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{agent.name}</h2>
        <ul className="text-gray-700 text-sm space-y-1">
          <li><span className="font-semibold">Estado:</span> {agent.status}</li>
          <li><span className="font-semibold">Sistema Operativo:</span> {agent.os}</li>
          <li><span className="font-semibold">Última conexión:</span> {agent.lastSeen}</li>
          <li><span className="font-semibold">IP:</span> {agent.ip}</li>
          <li><span className="font-semibold">ID:</span> {agent.id}</li>
        </ul>
      </div>
    </div>
  );
};

export default AgentCard;
