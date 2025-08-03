import React, { useState } from "react";
import { 
  Settings, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Server,
  Monitor,
  Cpu,
  Network,
  Shield,
  Terminal,
  Eye,
  EyeOff,
  Copy,
  RefreshCw
} from "lucide-react";

const Generar = () => {
  const [config, setConfig] = useState({
    host: "192.168.148.1",
    port: "5000",
    mode: "ws",
    os: "windows",
    arch: "amd64",
    enable_persistence: true,
    debug: true
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const osOptions = [
    { value: "windows", label: "Windows", icon: "🪟" },
    { value: "linux", label: "Linux", icon: "🐧" },
    { value: "darwin", label: "macOS", icon: "🍎" }
  ];

  const archOptions = [
    { value: "amd64", label: "AMD64 (x64)", icon: "💾" },
    { value: "386", label: "386 (x32)", icon: "📱" },
    { value: "arm64", label: "ARM64", icon: "🔧" },
    { value: "arm", label: "ARM", icon: "⚙️" }
  ];

  const modeOptions = [
    { value: "ws", label: "WebSocket", icon: "🔗", description: "Conexión en tiempo real" },
    { value: "http", label: "HTTP", icon: "🌐", description: "Conexión tradicional" },
    { value: "tcp", label: "TCP", icon: "⚡", description: "Conexión directa TCP" }
  ];

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset status when config changes
    setSuccess(false);
    setError(null);
  };

  const validateConfig = () => {
    const errors = [];
    
    if (!config.host.trim()) {
      errors.push("El host es requerido");
    }
    
    if (!config.port || isNaN(config.port) || config.port < 1 || config.port > 65535) {
      errors.push("Puerto debe ser un número entre 1 y 65535");
    }
    
    return errors;
  };

  const handleGenerate = async () => {
    const validationErrors = validateConfig();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Check if response is binary (executable file)
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/octet-stream')) {
        // Download binary file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent_${config.os}_${config.arch}.exe`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess(true);
      } else {
        // Handle JSON response
        const data = await response.json();
        console.log('Response:', data);
        setSuccess(true);
      }
    } catch (err) {
      console.error('Error generating agent:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      host: "192.168.148.1",
      port: "5000",
      mode: "ws",
      os: "windows",
      arch: "amd64",
      enable_persistence: true,
      debug: true
    });
    setSuccess(false);
    setError(null);
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Settings className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Generador de Agentes</h1>
              <p className="text-gray-600">Configura y genera agentes personalizados para tu infraestructura</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Server className="w-5 h-5 text-gray-600" />
                    Configuración del Agente
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={copyConfig}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                      title="Copiar configuración"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={resetToDefaults}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                      title="Restablecer valores por defecto"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Network Configuration */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-600" />
                    Configuración de Red
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Host del Servidor
                      </label>
                      <input
                        type="text"
                        value={config.host}
                        onChange={(e) => handleInputChange('host', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="192.168.1.100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puerto
                      </label>
                      <input
                        type="number"
                        value={config.port}
                        onChange={(e) => handleInputChange('port', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="5000"
                        min="1"
                        max="65535"
                      />
                    </div>
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-600" />
                    Modo de Conexión
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {modeOptions.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => handleInputChange('mode', mode.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          config.mode === mode.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{mode.icon}</span>
                          <div>
                            <div className="font-medium">{mode.label}</div>
                            <div className="text-sm text-gray-600">{mode.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-orange-600" />
                    Plataforma de Destino
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sistema Operativo
                      </label>
                      <select
                        value={config.os}
                        onChange={(e) => handleInputChange('os', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      >
                        {osOptions.map((os) => (
                          <option key={os.value} value={os.value}>
                            {os.icon} {os.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arquitectura
                      </label>
                      <select
                        value={config.arch}
                        onChange={(e) => handleInputChange('arch', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      >
                        {archOptions.map((arch) => (
                          <option key={arch.value} value={arch.value}>
                            {arch.icon} {arch.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Opciones Avanzadas
                  </button>
                  
                  {showAdvanced && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Habilitar Persistencia
                          </label>
                          <p className="text-xs text-gray-500">Mantiene el agente activo entre reinicios</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('enable_persistence', !config.enable_persistence)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config.enable_persistence ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.enable_persistence ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Modo Debug
                          </label>
                          <p className="text-xs text-gray-500">Habilita Modulo para evadir análisis estático</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('debug', !config.debug)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config.debug ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.debug ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview and Actions */}
          <div className="space-y-6">
            {/* Configuration Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-600" />
                  Vista Previa
                </h3>
              </div>
              <div className="p-4">
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-48 font-mono">
{JSON.stringify(config, null, 2)}
                </pre>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">¡Éxito!</span>
                </div>
                <p className="text-emerald-700 text-sm mt-1">Agente generado y descargado correctamente</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generar Agente
                </>
              )}
            </button>

            {/* Info Panel */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-800">Información</span>
              </div>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• El agente se descargará automáticamente</li>
                <li>• Compatible con múltiples plataformas</li>
                <li>• Configuración personalizable</li>
                <li>• Conexión segura y encriptada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generar;