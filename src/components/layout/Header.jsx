import { Phone, ChevronDown, Menu, User, Settings, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { AnimatePresence, motion } from "framer-motion";

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/auth/login"); };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-dct-gray">
          <Menu size={18} />
        </button>
        {/* Top nav links - desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {["Home","About","Courses","Contact Us","Tutor"].map(item => (
            <a key={item} href="#" className="text-sm font-semibold text-dct-dark hover:text-dct-primary transition-colors">{item}</a>
          ))}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-dct-dark">
          <div className="w-8 h-8 rounded-full bg-dct-primary/10 flex items-center justify-center">
            <Phone size={14} className="text-dct-primary" />
          </div>
          <span>{user?.phone || "+91 1234567890"}</span>
        </div>

        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-dct-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-dct-dark">{user?.name || "User"}</span>
            <ChevronDown size={14} className={`text-dct-gray transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-modal border border-gray-100 overflow-hidden z-50"
                initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.15 }}>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dct-dark hover:bg-gray-50 font-medium transition-colors">
                  <User size={15} className="text-dct-gray" /> Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dct-dark hover:bg-gray-50 font-medium transition-colors">
                  <Settings size={15} className="text-dct-gray" /> Settings
                </button>
                <div className="border-t border-gray-100" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-semibold transition-colors">
                  <LogOut size={15} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
