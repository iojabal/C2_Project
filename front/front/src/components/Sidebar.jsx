import {
  HiOutlineHome,
  HiOutlineDesktopComputer,
  HiOutlineTerminal,
  HiOutlineDocumentText,
  HiOutlineCog,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { NavLink } from "react-router-dom";
import { useState } from "react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const navItems = [
    {
      label: "Agentes",
      to: "/agentes",
      icon: <HiOutlineDesktopComputer size={20} />,
      badge: 2,
    },
    { label: "Consola", to: "/consola", icon: <HiOutlineTerminal size={20} /> },
    {
      label: "Historial",
      to: "/historial",
      icon: <HiOutlineDocumentText size={20} />,
    },
    { label: "Generar", to: "/generar", icon: <HiOutlineCog size={20} /> },
  ];

  return (
    <aside
      className={`bg-[#1E1F23] text-[#BDBDBD] h-screen transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } fixed left-0 top-0 flex flex-col justify-between`}
    >
      <div>
        {/* Logo */}
        <div
          className={`text-white font-bold text-md px-4 py-4 transition-all duration-300 whitespace-nowrap overflow-hidden ${
            collapsed ? "opacity-0 w-0" : "opacity-100 w-full"
          }`}
        >
          Cybersecurity SRL.
        </div>

        {/* Navegación */}
        <nav className="flex flex-col gap-1 mt-4">
          {navItems.map(({ label, to, icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all relative ${
                  isActive
                    ? "bg-[#2B2C30] text-white"
                    : "hover:bg-[#2B2C30] text-[#BDBDBD]"
                } ${collapsed ? "justify-center px-2" : ""}`
              }
            >
              {icon}
              {!collapsed && <span className="text-sm">{label}</span>}
              {/* Badge */}
              {badge && !collapsed && (
                <span className="ml-auto text-xs bg-[#3A3B3F] text-white px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Botón para colapsar */}
      <button
        onClick={toggleSidebar}
        className="text-gray-400 hover:text-white p-2 self-end m-2"
      >
        {collapsed ? <HiChevronRight size={20} /> : <HiChevronLeft size={20} />}
      </button>
    </aside>
  );
};

export default Sidebar;
