import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ClipboardList, BookOpen, HelpCircle, ChevronDown, X, Layers, GraduationCap, Users } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

const STUDENT_NAV = [
  { label: "My Courses", icon: BookOpen, to: "/student/courses" },
  { label: "Sessions", icon: CalendarDays, children: [
    { label: "All Sessions",       to: "/student/sessions/all" },
    { label: "Upcoming Sessions",  to: "/student/sessions/upcoming" },
    { label: "Completed Sessions", to: "/student/sessions/completed" },
  ]},
  { label: "Assignments", icon: ClipboardList, children: [
    { label: "All Assignments",       to: "/student/assignments/all" },
    { label: "Assignments Feedback",  to: "/student/assignments/feedback" },
  ]},
  { label: "Syllabus",   icon: BookOpen,   to: "/student/syllabus" },
  { label: "My Queries", icon: HelpCircle, to: "/student/queries" },
];

const TUTOR_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/tutor/dashboard" },
  { label: "Sessions",  icon: CalendarDays, children: [
    { label: "All Sessions",       to: "/tutor/sessions/all" },
    { label: "Upcoming Sessions",  to: "/tutor/sessions/upcoming" },
    { label: "Completed Sessions", to: "/tutor/sessions/completed" },
  ]},
  { label: "Assignments", icon: ClipboardList, to: "/tutor/assignments" },
  { label: "My Batches",  icon: Layers,      to: "/tutor/batches" },
];

const ADMIN_NAV = [
  { label: "Dashboard",  icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Tutors",     icon: GraduationCap,   to: "/admin/tutors" },
  { label: "Students",   icon: Users,           to: "/admin/students" },
  { label: "Batches",    icon: Layers,          to: "/admin/batches" },
  { label: "Queries",    icon: HelpCircle,      to: "/admin/queries" },
];

function NavItem({ item, onClose }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => item.children?.some(c => location.pathname.startsWith(c.to)));

  if (item.children) {
    const isAnyActive = item.children.some(c => location.pathname === c.to);
    return (
      <div>
        <button onClick={() => setOpen(v => !v)}
          className={`sidebar-item w-full ${isAnyActive ? "text-white" : ""}`}>
          <item.icon size={18} />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="ml-6 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                {item.children.map(child => (
                  <NavLink key={child.to} to={child.to} onClick={onClose}
                    className={({ isActive }) => `flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-150
                      ${isActive ? "text-white" : "text-gray-400 hover:text-white"}`}>
                    {({ isActive }) => (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-dct-primary" : "bg-transparent"}`} />
                        {child.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <NavLink to={item.to} onClick={onClose}
      className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
      <item.icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const nav = user?.role === "tutor" ? TUTOR_NAV : user?.role === "admin" ? ADMIN_NAV : STUDENT_NAV;

  const content = (
    <div className="flex flex-col h-full bg-dct-dark text-white w-56 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-lg"
          style={{ background: "linear-gradient(135deg, #007BBF, #024981)" }}>D</div>
        <span className="font-bold text-base tracking-tight">Dashboard</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(item => <NavItem key={item.label} item={item} onClose={onClose} />)}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-full">{content}</div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose} />
            <motion.div className="fixed left-0 top-0 h-full z-50 lg:hidden shadow-2xl"
              initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="relative">
                {content}
                <button onClick={onClose} className="absolute top-4 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
