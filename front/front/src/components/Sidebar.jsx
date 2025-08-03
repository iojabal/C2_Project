import { useState } from "react";
import { 
  Monitor, 
  Terminal, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Zap
} from "lucide-react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Agentes");
  // Simulando agentes para el ejemplo
  const activeCount = 3;

  const toggleSidebar = () => setCollapsed(!collapsed);

  const navItems = [
    {
      label: "Agentes",
      to: "/agentes",
      icon: <Monitor size={20} />,
      description: "Monitoreo de agentes"
    },
    {
      label: "Consola",
      to: "/consola",
      icon: <Terminal size={20} />,
      description: "Terminal interactiva"
    },
    {
      label: "Historial",
      to: "/historial",
      icon: <FileText size={20} />,
      description: "Registro de actividad"
    },
    {
      label: "Generar",
      to: "/generar",
      icon: <Settings size={20} />,
      description: "Herramientas de generación"
    },
  ];

  return (
    <aside
      className={`bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-gray-300 h-screen transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      } fixed left-0 top-0 flex flex-col justify-between shadow-2xl border-r border-gray-700/50`}
    >
      <div>
        {/* Logo */}
        <div className="p-6 border-b border-gray-700/50">
          <div
            className={`transition-all duration-300 ${
              collapsed ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            {!collapsed && (
              <div>
                <h1 className="text-white font-bold text-xl bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                  Cybersecurity
                </h1>
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  SRL. Security Platform
                </p>
              </div>
            )}
          </div>
          
          {collapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {!collapsed && (
          <div className="px-6 py-4">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-400">Sistema Activo</span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">
                  {activeCount} conectados
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="px-4 py-2">
          <div className="space-y-2">
            {navItems.map(({ label, to, icon, description }) => (
              <button
                key={to}
                onClick={() => setActiveItem(label)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden w-full text-left ${
                  activeItem === label
                    ? "bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                    : "hover:bg-gray-800/50 text-gray-300 hover:text-white border border-transparent hover:border-gray-700/50"
                } ${collapsed ? "justify-center px-3" : ""}`}
              >
                {/* Icon Container */}
                <div className={`transition-all duration-200 ${
                  activeItem === label
                    ? "text-emerald-400 scale-110" 
                    : "text-gray-400 group-hover:text-emerald-400 group-hover:scale-105"
                }`}>
                  {icon}
                </div>

                {/* Text Content */}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{label}</span>
                    </div>
                    <p className={`text-xs transition-all duration-200 truncate ${
                      activeItem === label
                        ? "text-emerald-300/80" 
                        : "text-gray-500 group-hover:text-gray-400"
                    }`}>
                      {description}
                    </p>
                  </div>
                )}

                {/* Active Indicator */}
                {activeItem === label && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-blue-500 rounded-r"></div>
                )}

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all duration-300 rounded-xl"></div>
              </button>
            ))}
          </div>
        </nav>

        {/* Additional Info */}
        {!collapsed && (
          <div className="px-6 mt-8">
            <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-lg p-4 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-400">Seguridad Activa</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Monitoreo continuo y protección en tiempo real
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer con botón de colapsar */}
      <div className="p-4 border-t border-gray-700/50">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
        >
          <div className="group-hover:scale-110 transition-transform duration-200">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </div>
          {!collapsed && (
            <span className="text-sm font-medium">Contraer panel</span>
          )}
        </button>

        {/* User Info (collapsed state) */}
        {collapsed && (
          <div className="mt-2 flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;