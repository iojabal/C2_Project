import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Calendar,
  User,
  Shield,
  ShieldCheck,
  Network,
  Monitor,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Terminal,
  FileText
} from "lucide-react";

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    processes: false,
    connections: false,
    persistence: false,
    files: false,
    exfiltrated: false,
    commands: false
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/v1/reports/${id}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setReport(data.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      let date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes(' ')) {
        const mainPart = dateString.split(' ').slice(0, 2).join(' ');
        const cleanPart = mainPart.replace(/\.\d+/, '');
        date = new Date(cleanPart);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Error en fecha';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadJson = () => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `report_${report.hostname}_${report.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const InfoCard = ({ title, value, icon: Icon, type = "default" }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          type === "danger" ? "bg-red-100 text-red-600" :
          type === "warning" ? "bg-orange-100 text-orange-600" :
          type === "success" ? "bg-green-100 text-green-600" :
          "bg-blue-100 text-blue-600"
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`font-semibold ${
            type === "danger" ? "text-red-900" :
            type === "warning" ? "text-orange-900" :
            type === "success" ? "text-green-900" :
            "text-gray-900"
          }`}>{value}</p>
        </div>
      </div>
    </div>
  );

  const CollapsibleSection = ({ title, items, type, isExpanded, onToggle }) => {
    const normalizedItems = items || [];
    const itemCount = normalizedItems.length;
    
    const parseContent = (item) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      }
      return item;
    };

    const StructuredView = ({ data, itemType }) => {
      if (itemType === 'persistence' && typeof data === 'object') {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-orange-800">Mecanismo de Persistencia</span>
            </div>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</div>
                <div className="col-span-2 font-mono text-gray-800 break-all">{value}</div>
              </div>
            ))}
          </div>
        );
      }

      if (itemType === 'processes' && typeof data === 'object') {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Información del Proceso</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {data.name && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Nombre:</span>
                  <span className="font-mono text-gray-800">{data.name}</span>
                </div>
              )}
              {data.pid && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">PID:</span>
                  <span className="font-mono text-gray-800">{data.pid}</span>
                </div>
              )}
              {data.cpu !== undefined && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">CPU:</span>
                  <span className="font-mono text-gray-800">{data.cpu}%</span>
                </div>
              )}
              {data.memory !== undefined && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Memoria:</span>
                  <span className="font-mono text-gray-800">{data.memory} MB</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (itemType === 'connections' && typeof data === 'object') {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-800">Conexión de Red</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {(data.protocol || data.Protocol) && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Protocolo:</span>
                  <span className="font-mono text-gray-800 uppercase">{data.protocol || data.Protocol}</span>
                </div>
              )}
              {(data.local || data.Local) && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Local:</span>
                  <span className="font-mono text-gray-800">{data.local || data.Local}</span>
                </div>
              )}
              {(data.remote || data.Remote) && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Remoto:</span>
                  <span className="font-mono text-gray-800">{data.remote || data.Remote}</span>
                </div>
              )}
              {(data.status || data.Status) && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Estado:</span>
                  <span className={`font-mono px-2 py-1 rounded text-xs ${
                    (data.status || data.Status) === 'ESTABLISHED' ? 'bg-green-100 text-green-800' :
                    (data.status || data.Status) === 'LISTEN' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{data.status || data.Status}</span>
                </div>
              )}
              {(data.ip || data.IP) && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">IP:</span>
                  <span className="font-mono text-gray-800">{data.ip || data.IP}</span>
                </div>
              )}
              {(data.port || data.Port) && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Puerto:</span>
                  <span className="font-mono text-gray-800">{data.port || data.Port}</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (itemType === 'commands' && typeof data === 'object') {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-orange-800">Comando Ejecutado</span>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-green-400 font-mono text-sm">$</span>
                <code className="text-green-400 font-mono text-sm break-all flex-1">
                  {data.cmd || data.command || JSON.stringify(data)}
                </code>
              </div>
              {data.output && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <span className="text-gray-400 text-xs">Salida:</span>
                  <pre className="text-gray-300 font-mono text-xs mt-1 whitespace-pre-wrap break-all">
                    {data.output}
                  </pre>
                </div>
              )}
              {data.timestamp && (
                <div className="mt-2 text-gray-500 text-xs">
                  Ejecutado: {new Date(data.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (itemType === 'commands' && typeof data === 'string') {
        return (
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-mono text-sm">$</span>
              <code className="text-green-400 font-mono text-sm break-all flex-1">
                {data}
              </code>
            </div>
          </div>
        );
      }

      if (typeof data === 'object') {
        return (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-medium text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:
                </span>
                <span className="font-mono text-gray-800 break-all text-sm">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="font-mono text-gray-800 text-sm break-all whitespace-pre-wrap">
          {data}
        </div>
      );
    };
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              type === 'exfiltrated' ? 'bg-red-100' :
              type === 'commands' ? 'bg-orange-100' :
              type === 'persistence' ? 'bg-orange-100' :
              type === 'processes' ? 'bg-blue-100' :
              type === 'connections' ? 'bg-green-100' :
              'bg-blue-100'
            }`}>
              {type === 'exfiltrated' ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : type === 'commands' ? (
                <Terminal className="w-4 h-4 text-orange-600" />
              ) : type === 'persistence' ? (
                <Shield className="w-4 h-4 text-orange-600" />
              ) : type === 'processes' ? (
                <Cpu className="w-4 h-4 text-blue-600" />
              ) : type === 'connections' ? (
                <Network className="w-4 h-4 text-green-600" />
              ) : (
                <Database className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{itemCount} elementos</p>
            </div>
          </div>
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        
        {isExpanded && itemCount > 0 && (
          <div className="border-t border-gray-200 p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {normalizedItems.map((item, index) => {
                const parsedItem = parseContent(item);
                
                return (
                  <div key={index} className={`rounded-lg p-4 border ${
                    type === 'exfiltrated' ? 'bg-red-50 border-red-200' :
                    type === 'commands' ? 'bg-orange-50 border-orange-200' :
                    type === 'persistence' ? 'bg-orange-50 border-orange-200' :
                    type === 'processes' ? 'bg-blue-50 border-blue-200' :
                    type === 'connections' ? 'bg-green-50 border-green-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    {type === 'exfiltrated' && typeof parsedItem === 'object' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <HardDrive className="w-4 h-4 text-red-600" />
                          <span className="font-semibold text-red-800">Archivo Exfiltrado</span>
                        </div>
                        <div className="text-sm">
                          <p><span className="font-medium">Ruta:</span> {parsedItem.path}</p>
                          <p><span className="font-medium">SHA256:</span> <span className="font-mono text-xs break-all">{parsedItem.sha256}</span></p>
                        </div>
                      </div>
                    ) : (
                      <StructuredView data={parsedItem} itemType={type} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {isExpanded && itemCount === 0 && (
          <div className="border-t border-gray-200 p-6 text-center">
            <p className="text-gray-500">No hay elementos para mostrar</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="flex items-center gap-3 text-gray-600">
              <Database className="w-6 h-6 animate-pulse" />
              <span className="text-lg">Cargando reporte...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error al cargar el reporte</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Reporte no encontrado</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Detalle del Reporte</h1>
                <p className="text-gray-600">{report.hostname} - {formatDate(report.lastseen)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadJson}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar JSON
            </button>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showRawJson ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showRawJson ? 'Ocultar JSON' : 'Ver JSON'}
            </button>
            <button
              onClick={() => copyToClipboard(JSON.stringify(report, null, 2))}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </button>
          </div>
        </div>

        {showRawJson && (
          <div className="mb-8 bg-gray-900 rounded-xl p-6 overflow-auto">
            <pre className="text-green-400 text-sm">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <InfoCard 
            title="Hostname" 
            value={report.hostname} 
            icon={Monitor} 
          />
          <InfoCard 
            title="Sistema Operativo" 
            value={`${report.os} ${report.arch}`} 
            icon={Cpu} 
          />
          <InfoCard 
            title="Usuario" 
            value={report.user || 'N/A'} 
            icon={User} 
          />
          <InfoCard 
            title="Privilegios" 
            value={report.elevated ? 'Elevado' : 'Estándar'} 
            icon={report.elevated ? Shield : ShieldCheck}
            type={report.elevated ? 'warning' : 'success'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard 
            title="Gateway" 
            value={report.gateway || 'N/A'} 
            icon={Network} 
          />
          <InfoCard 
            title="IPs Detectadas" 
            value={report.ips?.length || 0} 
            icon={Wifi} 
          />
          <InfoCard 
            title="Servidores DNS" 
            value={report.dns?.length || 0} 
            icon={Server} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <InfoCard 
            title="Primera Conexión" 
            value={formatDate(report.firstseen)} 
            icon={Clock} 
          />
          <InfoCard 
            title="Última Actividad" 
            value={formatDate(report.lastseen)} 
            icon={Activity} 
          />
        </div>

        {report.antidebug && (
          <div className="mb-8">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Alerta de Seguridad</h3>
                  <p className="text-orange-700">Se detectó actividad anti-debug en este sistema</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <CollapsibleSection
            title="Procesos Activos"
            items={report.processes}
            type="processes"
            isExpanded={expandedSections.processes}
            onToggle={() => toggleSection('processes')}
          />

          <CollapsibleSection
            title="Conexiones de Red"
            items={report.connections}
            type="connections"
            isExpanded={expandedSections.connections}
            onToggle={() => toggleSection('connections')}
          />

          <CollapsibleSection
            title="Mecanismos de Persistencia"
            items={report.persistence}
            type="persistence"
            isExpanded={expandedSections.persistence}
            onToggle={() => toggleSection('persistence')}
          />

          <CollapsibleSection
            title="Archivos Accedidos"
            items={report.filesaccessed}
            type="files"
            isExpanded={expandedSections.files}
            onToggle={() => toggleSection('files')}
          />

          <CollapsibleSection
            title="Archivos Exfiltrados"
            items={report.files_exfiltrated}
            type="exfiltrated"
            isExpanded={expandedSections.exfiltrated}
            onToggle={() => toggleSection('exfiltrated')}
          />

          <CollapsibleSection
            title="Comandos Ejecutados"
            items={report.commands_executed || report.commandsrun}
            type="commands"
            isExpanded={expandedSections.commands}
            onToggle={() => toggleSection('commands')}
          />
        </div>

        {(report.ips?.length > 0 || report.dns?.length > 0) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.ips?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Direcciones IP
                </h3>
                <div className="space-y-2">
                  {report.ips.map((ip, index) => (
                    <div key={index} className="px-3 py-2 bg-gray-50 rounded font-mono text-sm">
                      {ip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.dns?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Servidores DNS
                </h3>
                <div className="space-y-2">
                  {report.dns.map((dns, index) => (
                    <div key={index} className="px-3 py-2 bg-gray-50 rounded font-mono text-sm">
                      {dns}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetail;