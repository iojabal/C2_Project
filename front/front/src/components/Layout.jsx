import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

const Layout = () => {
  // Escucha el estado desde el sidebar si lo quieres global en el futuro
  const [collapsed, setCollapsed] = useState(false); // opcional

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <Sidebar />
      <main
        className={`transition-all duration-300 flex-1 overflow-auto ${
          collapsed ? "ml-20" : "ml-72"
        }`}
        style={{ background: "#0d1117" }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
