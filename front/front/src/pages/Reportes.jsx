import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Monitor, 
  Calendar, 
  Activity, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Server,
  Clock,
  Shield,
  Database,
  Network,
  Cpu,
  HardDrive
} from "lucide-react";

const Reportes = () => {
  const [agentsWithReports, setAgentsWithReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Función para formatear fechas de manera segura
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      // Intentar diferentes formatos de fecha
      let date;
      
      // Si la fecha viene en formato ISO
      if (dateString.includes('T')) {
        date = new Date(dateString);
      }
      // Si la fecha viene en formato "2025-08-02 20:16:38.3133776 -0400 -04 m=+236.122339901"
      else if (dateString.includes(' ')) {
        // Extraer solo la parte de fecha y hora principal
        const mainPart = dateString.split(' ').slice(0, 2).join(' ');
        // Remover la parte decimal de los segundos si existe
        const cleanPart = mainPart.replace(/\.\d+/, '');
        date = new Date(cleanPart);
      }
      // Otros formatos
      else {
        date = new Date(dateString);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Error en fecha';
    }
  };

  useEffect(() => {
    fetchAgentsWithReports();
  }, []);

  const fetchAgentsWithReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/v1/agents-with-reports');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setAgentsWithReports(data.data || []);
    } catch (err) {
      console.error('Error fetching agents with reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentReports = async (agentUUID) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/agents/${agentUUID}/reports`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error fetching agent reports:', err);
      return [];
    }
  };

  const handleExpandAgent = async (agent) => {
    if (expandedAgent === agent.UUID) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agent.UUID);
      
      // Si el agente no tiene reportes cargados, intentar cargarlos
      if (agent.reportCount > 0 && (!agent.reports || agent.reports.length === 0)) {
        const reports = await fetchAgentReports(agent.UUID);
        // Actualizar el agente con los reportes
        setAgentsWithReports(prev => 
          prev.map(a => 
            a.UUID === agent.UUID 
              ? { ...a, reports: reports }
              : a
          )
        );
      }
    }
  };

  const filteredAgents = agentsWithReports.filter(agent => {
    const matchesSearch = agent.Hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.UUID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.OS?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "with-reports") return matchesSearch && agent.reportCount > 0;
    if (filterType === "without-reports") return matchesSearch && agent.reportCount === 0;
    if (filterType === "active") return matchesSearch && agent.Active;
    if (filterType === "connected") return matchesSearch && agent.Connected;
    
    return matchesSearch;
  });

  const StatusBadge = ({ connected, active }) => {
    if (connected && active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          Activo
        </span>
      );
    } else if (connected) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          Conectado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          Offline
        </span>
      );
    }
  };

  const ReportCard = ({ report }) => (
    <div 
      className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => window.open(`/report/${report.id}`, '_blank')}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded">
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{report.hostname}</h4>
            <p className="text-xs text-gray-500">Reporte de auditoría</p>
          </div>
        </div>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(report.LastSeen)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-gray-500">Usuario:</span>
          <p className="font-medium text-gray-900">{report.user || 'N/A'}</p>
        </div>
        <div>
          <span className="text-gray-500">Privilegios:</span>
          <p className={`font-medium ${report.elevated ? 'text-orange-600' : 'text-green-600'}`}>
            {report.elevated ? 'Elevado' : 'Estándar'}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Procesos:</span>
          <p className="font-medium text-gray-900">{report.processes?.length || 0}</p>
        </div>
        <div>
          <span className="text-gray-500">Conexiones:</span>
          <p className="font-medium text-gray-900">{report.connections?.length || 0}</p>
        </div>
        <div>
          <span className="text-gray-500">IPs:</span>
          <p className="font-medium text-gray-900">{report.ips?.length || 0}</p>
        </div>
        <div>
          <span className="text-gray-500">Gateway:</span>
          <p className="font-medium text-gray-900">{report.gateway || 'N/A'}</p>
        </div>
      </div>

      {report.antidebug && (
        <div className="mt-3 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          <AlertTriangle className="w-3 h-3" />
          Anti-debug detectado
        </div>
      )}
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-blue-600 font-medium">Click para ver detalle completo</span>
        <Eye className="w-4 h-4 text-blue-600" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="flex items-center gap-3 text-gray-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-lg">Cargando reportes...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
                <p className="text-gray-600">Monitoreo detallado de agentes y actividad del sistema</p>
              </div>
            </div>
            <button
              onClick={fetchAgentsWithReports}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Monitor className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredAgents.length}</p>
                <p className="text-sm text-gray-600">Total Agentes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAgents.reduce((sum, agent) => sum + (agent.reportCount || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Reportes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAgents.filter(a => a.Active).length}
                </p>
                <p className="text-sm text-gray-600">Agentes Activos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAgents.filter(a => a.reportCount > 0).length}
                </p>
                <p className="text-sm text-gray-600">Con Reportes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por hostname, UUID o OS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los agentes</option>
                <option value="with-reports">Con reportes</option>
                <option value="without-reports">Sin reportes</option>
                <option value="active">Activos</option>
                <option value="connected">Conectados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Error al cargar reportes</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Agents List */}
        <div className="space-y-4">
          {filteredAgents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron agentes
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== "all" 
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "No hay agentes registrados en el sistema"
                }
              </p>
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <div key={agent.UUID} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpandAgent(agent)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {expandedAgent === agent.UUID ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <div className={`p-3 rounded-lg ${
                          agent.Active 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : agent.Connected 
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Monitor className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.Hostname}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            {agent.OS}
                          </span>
                          <span className="flex items-center gap-1">
                            <Network className="w-3 h-3" />
                            {agent.IP}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(agent.LastSeen)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{agent.reportCount || 0}</p>
                        <p className="text-xs text-gray-600">Reportes</p>
                      </div>
                      <StatusBadge connected={agent.Connected} active={agent.Active} />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedAgent === agent.UUID && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {agent.reportCount === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="font-medium text-gray-900 mb-2">Sin reportes disponibles</h4>
                        <p className="text-gray-600 text-sm">Este agente no ha enviado reportes de auditoría</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">
                            Reportes de Auditoría ({agent.reportCount})
                          </h4>
                          <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                            Exportar
                          </button>
                        </div>
                        
                        {agent.reports && agent.reports.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {agent.reports.slice(0, 4).map((report, index) => (
                              <ReportCard key={index} report={report} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                            <span className="text-gray-600">Cargando reportes...</span>
                          </div>
                        )}
                        
                        {agent.reports && agent.reports.length > 4 && (
                          <div className="mt-4 text-center">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Ver todos los reportes ({agent.reportCount})
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;