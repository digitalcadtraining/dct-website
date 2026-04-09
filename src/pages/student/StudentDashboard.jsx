import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, BookOpen, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const QUICK = [
  { label:"All Sessions",   icon:CalendarDays,   to:"/student/sessions/all",     color:"bg-blue-50 text-dct-primary" },
  { label:"My Assignments", icon:ClipboardList,   to:"/student/assignments/all",  color:"bg-purple-50 text-purple-600" },
  { label:"My Courses",     icon:BookOpen,        to:"/student/courses",          color:"bg-green-50 text-green-600" },
  { label:"My Queries",     icon:HelpCircle,      to:"/student/queries",          color:"bg-orange-50 text-orange-600" },
];

export default function StudentDashboard() {
  return (
    <AppShell>
      <PageWrapper>
        <h2 className="text-xl font-bold text-dct-dark mb-6">Welcome back! 👋</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK.map((q, i) => (
            <motion.div key={q.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.07 }}>
              <Link to={q.to} className="dct-card p-5 flex flex-col items-center gap-3 hover:shadow-card-hover transition-all group">
                <div className={`w-12 h-12 rounded-2xl ${q.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <q.icon size={22} />
                </div>
                <span className="text-sm font-semibold text-dct-dark text-center">{q.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
