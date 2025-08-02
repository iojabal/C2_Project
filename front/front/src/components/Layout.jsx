import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

const Layout = () => {
  // Escucha el estado desde el sidebar si lo quieres global en el futuro
  const [collapsed, setCollapsed] = useState(false); // opcional

  return (
    <div className="flex">
      <Sidebar />
      <main
        className={`transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        } w-full min-h-screen bg-gray-100 p-8`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
