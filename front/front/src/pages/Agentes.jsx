import React, { useState, useEffect } from "react";
import { useAgents } from "../context/AgentContext";
import { Monitor, Wifi, WifiOff, Activity, Calendar, Server, Globe } from "lucide-react";

const Agentes = () => {
  const agents = useAgents();
  const [allAgents, setAllAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageSize = 6;

  useEffect(() => {
    const fetchAllAgents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/agents');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setAllAgents(data);
      } catch (err) {
        console.error('Error fetching all agents:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAgents();
    const interval = setInterval(fetchAllAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeAgents = agents.filter((a) => a.Connected && a.Active);
  const paginatedAgents = allAgents.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(allAgents.length / pageSize);

  const StatusBadge = ({ connected, active }) => {
    if (connected && active) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
            Activo
          </span>
        </div>
      );
    } else if (connected) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
            Conectado
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            Offline
          </span>
        </div>
      );
    }
  };

  const AgentCard = ({ agent, isActive = false }) => (
    <div className={`group relative bg-white rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
      isActive ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              agent.Connected && agent.Active 
                ? 'bg-emerald-100 text-emerald-600' 
                : agent.Connected 
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                {agent.Hostname}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Server className="w-3 h-3" />
                {agent.OS}
              </p>
            </div>
          </div>
          <StatusBadge connected={agent.Connected} active={agent.Active} />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              IP Address
            </span>
            <span className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
              {agent.IP}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Última conexión
            </span>
            <span className="text-gray-700">
              {new Date(agent.LastSeen).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-emerald-600" />
                Panel de Agentes
              </h1>
              <p className="text-gray-600 mt-1">Monitoreo en tiempo real de agentes conectados</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">
                  {activeAgents.length} Activos
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Server className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {allAgents.length} Total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Agentes Activos */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wifi className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Agentes Activos
              <span className="ml-2 text-lg font-normal text-gray-500">
                ({activeAgents.length})
              </span>
            </h2>
          </div>
          
          {activeAgents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay agentes activos</h3>
              <p className="text-gray-600">Los agentes conectados aparecerán aquí en tiempo real</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAgents.map((agent) => (
                <AgentCard key={agent.UUID} agent={agent} isActive={true} />
              ))}
            </div>
          )}
        </section>

        {/* Todos los Agentes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Historial de Agentes
                <span className="ml-2 text-lg font-normal text-gray-500">
                  ({allAgents.length})
                </span>
              </h2>
              {loading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Actualizando...</span>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <h3 className="font-semibold text-red-800">Error de conexión</h3>
              </div>
              <p className="text-red-700 mb-2">{error}</p>
              <p className="text-sm text-red-600">
                Verifica que el servidor esté ejecutándose en http://localhost:5000
              </p>
            </div>
          )}

          {loading && allAgents.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="w-16 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full h-3 bg-gray-200 rounded"></div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedAgents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error ? 'Error al cargar agentes' : 'No hay agentes registrados'}
              </h3>
              <p className="text-gray-600">
                {error ? 'Revisa la conexión al servidor' : 'Los agentes registrados aparecerán aquí'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedAgents.map((agent) => (
                  <AgentCard key={agent.UUID} agent={agent} />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          page === n
                            ? "bg-gray-900 text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Agentes;