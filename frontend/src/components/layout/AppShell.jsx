import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f6fa]">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full px-3 sm:px-5 lg:px-6 py-4 sm:py-5 pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
