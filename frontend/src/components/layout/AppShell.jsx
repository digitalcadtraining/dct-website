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
          <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
