/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";

const AgentsContext = createContext([]);

export function AgentsProvider({ children }) {
  const [agents, setAgents] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    console.log("🔌 Intentando conectar WebSocket...");
    const ws = new WebSocket("ws://localhost:5000/ws/agents");
    
    ws.onopen = () => {
      console.log("✅ WebSocket conectado");
      setConnectionStatus('connected');
    };
    
    ws.onmessage = ({ data }) => {
      console.log("📨 Mensaje recibido del WebSocket:", data);
      try {
        const list = JSON.parse(data);
        console.log("📋 Agentes parseados:", list);
        setAgents(list);
      } catch (error) {
        console.error("❌ Error al parsear JSON:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("❌ Error en WebSocket:", error);
      setConnectionStatus('error');
    };
    
    ws.onclose = (event) => {
      console.log("🔌 WebSocket cerrado:", event.code, event.reason);
      setConnectionStatus('disconnected');
    };
    
    return () => {
      console.log("🔌 Cerrando WebSocket...");
      ws.close();
    };
  }, []);

  // Log cuando cambian los agentes
  useEffect(() => {
    console.log("🔄 Agentes actualizados:", agents);
    console.log("🔄 Agentes activos:", agents.filter(a => a.connected && a.active));
  }, [agents]);

  return (
    <AgentsContext.Provider value={{ agents, connectionStatus }}>
      {children}
    </AgentsContext.Provider>
  );
}

// Hook para usar la lista
export const useAgents = () => {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgents debe ser usado dentro de AgentsProvider');
  }
  return context.agents;
};

// Hook para usar el estado de conexión
export const useConnectionStatus = () => {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useConnectionStatus debe ser usado dentro de AgentsProvider');
  }
  return context.connectionStatus;
};