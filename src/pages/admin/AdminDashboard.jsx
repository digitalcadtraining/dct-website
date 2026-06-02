import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, GraduationCap, Layers, MessageSquare, Clock, ArrowUpRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi } from "../../services/api.js";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#7E7F81" };

function StatCard({ icon: Icon, label, value, sub, color, onClick, delay=0 }) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer group hover:-translate-y-1 transition-all duration-200"
      style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, delay }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color+"18" }}>
          <Icon size={20} style={{ color }} />
        </div>
        <ArrowUpRight size={14} style={{ color:C.lg }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-extrabold mb-0.5" style={{ color:C.dark }}>{value ?? 0}</p>
      <p className="text-sm font-semibold" style={{ color:C.gray }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color:C.lg }}>{sub}</p>}
    </motion.div>
  );
}

function Panel({ title, children, onViewAll, delay=0 }) {
  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, delay }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-extrabold" style={{ color:C.dark }}>{title}</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-bold flex items-center gap-1 hover:underline" style={{ color:C.primary }}>
            View All <ArrowUpRight size={11} />
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </motion.div>
  );
}

function EmptyRow({ text }) {
  return <div className="px-5 py-8 text-center text-sm font-semibold" style={{ color:C.lg }}>{text}</div>;
}

function safePct(num, den) {
  if (!den) return 0;
  return Math.max(0, Math.min(100, Math.round((num / den) * 100)));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [batches, setBatches] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [s, a, b, q] = await Promise.all([
        adminApi.stats(),
        adminApi.applications("PENDING"),
        adminApi.batches("ACTIVE"),
        adminApi.queries("OPEN"),
      ]);
      setStats(s.data || {});
      setApps(a.data || []);
      setBatches(b.data || []);
      setQueries(q.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cards = useMemo(() => {
    const s = stats || {};
    return [
      { icon:Users, label:"Total Students", value:s.totalStudents || 0, sub:`${s.activeStudents || 0} active`, color:C.primary, path:"/admin/students" },
      { icon:GraduationCap, label:"Tutors", value:s.totalTutors || 0, sub:`${s.pendingApplications || 0} pending approval`, color:"#8b5cf6", path:"/admin/tutors" },
      { icon:Layers, label:"Active Batches", value:s.activeBatches || 0, sub:`${s.completedBatches || 0} completed`, color:"#10b981", path:"/admin/batches" },
      { icon:MessageSquare, label:"Open Queries", value:s.unresolvedQueries || 0, sub:`of ${s.totalQueries || 0} total`, color:"#f59e0b", path:"/admin/queries" },
      { icon:Clock, label:"Pending Approvals", value:s.pendingApplications || 0, sub:"Tutor applications", color:"#ef4444", path:"/admin/tutors" },
    ];
  }, [stats]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color:C.dark }}>Admin Dashboard</h1>
            <p className="text-sm" style={{ color:C.gray }}>Live platform overview from database</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 bg-white" style={{ color:C.gray }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {err && <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">{err}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {cards.map((st,i) => <StatCard key={st.label} {...st} delay={i*0.05} onClick={() => st.path && navigate(st.path)} />)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel title="🕐 Pending Tutor Approvals" onViewAll={() => navigate("/admin/tutors")} delay={0.15}>
            {apps.length === 0 ? <EmptyRow text="No pending tutor applications." /> : apps.slice(0,4).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>{t.name?.[0] || "T"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color:C.dark }}>{t.name}</p>
                  <p className="text-xs" style={{ color:C.gray }}>{t.years_exp || 0}y exp · {t.course?.name || "Course"} · {t.location || "—"}</p>
                </div>
                <button onClick={() => navigate("/admin/tutors")} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white flex-shrink-0" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>Review</button>
              </div>
            ))}
          </Panel>

          <Panel title="❓ Open Queries" onViewAll={() => navigate("/admin/queries")} delay={0.2}>
            {queries.length === 0 ? <EmptyRow text="No open queries." /> : queries.slice(0,4).map(q => (
              <div key={q.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold flex-1 leading-snug" style={{ color:C.dark }}>
                    {q.question?.length > 75 ? q.question.slice(0,75)+"…" : q.question}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:"#fef3c7",color:"#92400e" }}>Open</span>
                </div>
                <p className="text-[11px] mt-1" style={{ color:C.lg }}>{q.student?.name || "Student"} · {q.session?.name || "General query"}</p>
              </div>
            ))}
          </Panel>

          <Panel title="📚 Active Batches" onViewAll={() => navigate("/admin/batches")} delay={0.25}>
            {batches.length === 0 ? <EmptyRow text="No active batches yet." /> : batches.slice(0,5).map(b => {
              const enrolled = b._count?.enrollments || 0;
              const capacity = b.max_students || 1;
              const pct = safePct(enrolled, capacity);
              return (
                <div key={b.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold truncate" style={{ color:C.dark }}>{b.name}</p>
                    <span className="text-xs font-semibold" style={{ color:C.gray }}>{enrolled}/{capacity} students</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color:C.lg }}>{b.tutor?.name || "Tutor"} · {b.course?.name || "Course"}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${C.blue},${C.primary})` }} />
                    </div>
                    <span className="text-[11px] font-bold" style={{ color:C.primary }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </Panel>

          <Panel title="👥 Platform Health" delay={0.3}>
            {[
              { label:"Active Students", value:stats?.activeStudents || 0, pct:safePct(stats?.activeStudents || 0, stats?.totalStudents || 0), color:C.primary },
              { label:"Query Resolution", value:`${safePct((stats?.totalQueries || 0) - (stats?.unresolvedQueries || 0), stats?.totalQueries || 0)}%`, pct:safePct((stats?.totalQueries || 0) - (stats?.unresolvedQueries || 0), stats?.totalQueries || 0), color:"#10b981" },
              { label:"Batch Completion", value:`${stats?.completedBatches || 0} done`, pct:safePct(stats?.completedBatches || 0, (stats?.completedBatches || 0) + (stats?.activeBatches || 0)), color:"#8b5cf6" },
            ].map((item,i) => (
              <div key={item.label} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color:C.dark }}>{item.label}</p>
                  <p className="text-sm font-extrabold" style={{ color:item.color }}>{item.value}</p>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100">
                  <motion.div className="h-full rounded-full" style={{ background:item.color }} initial={{ width:0 }} animate={{ width:`${item.pct}%` }} transition={{ duration:0.8, delay:0.3+i*0.1 }} />
                </div>
              </div>
            ))}
          </Panel>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
