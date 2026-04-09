/**
 * MyCourses.jsx — Fixed
 * Real data from backend batchApi.enrolled()
 * No dummy data at all
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";
import { batchApi } from "../../services/api.js";
import { BookOpen, ChevronRight } from "lucide-react";

const C = { dark:"#1F1A17", blue:"#024981", primary:"#007BBF", gray:"#6A6B6D", lg:"#9ca3af" };

function CourseCard({ enrollment, index }) {
  const batch  = enrollment.batch  || {};
  const course = batch.course      || {};
  const tutor  = batch.tutor       || {};
  const pct    = enrollment.progress || 0;
  const total  = batch._count?.scheduled_sessions || 0;
  const fmt    = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
  const status = batch.status === "ACTIVE" ? "In Progress" : batch.status === "UPCOMING" ? "Upcoming" : batch.status === "COMPLETED" ? "Completed" : batch.status || "—";
  const isActive = ["ACTIVE","UPCOMING"].includes(batch.status);
  return (
    <motion.div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, delay:index*0.08 }} whileHover={{ y:-3 }}>
      <div style={{ height:110, background:`linear-gradient(135deg,${C.blue},${C.primary})`, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)", backgroundSize:"22px 22px" }} />
        <div style={{ fontSize:36, opacity:0.7, position:"relative", zIndex:1 }}>⚙</div>
        <span style={{ position:"absolute", top:10, left:10, background:isActive?"rgba(34,197,94,0.9)":"rgba(255,255,255,0.2)", borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#fff" }}>{status}</span>
      </div>
      <div style={{ padding:16 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:3, lineHeight:1.3 }}>{course.name||"Course"}</h3>
        <p style={{ fontSize:11, color:C.gray, marginBottom:12 }}>{batch.name}</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
          {[["Start",fmt(batch.start_date)],["End",fmt(batch.end_date)],["Sessions",total],["Assignments",batch._count?.assignments||0]].map(([l,v])=>(
            <div key={l} style={{ border:"1px solid #e8ecf0", borderRadius:9, padding:"8px 10px" }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{v}</p>
              <p style={{ fontSize:10, color:C.lg }}>{l}</p>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:11, color:C.gray }}>Progress</span>
            <span style={{ fontSize:11, fontWeight:700, color:C.primary }}>{pct}%</span>
          </div>
          <div style={{ height:5, background:"#e5e7eb", borderRadius:4, overflow:"hidden" }}>
            <motion.div style={{ height:"100%", background:`linear-gradient(90deg,${C.blue},${C.primary})`, borderRadius:4 }} initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1 }} />
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${C.blue},${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>{tutor.name?.[0]?.toUpperCase()||"T"}</div>
          <div><p style={{ fontSize:12, fontWeight:700, color:C.dark }}>{tutor.name||"Tutor"}</p><p style={{ fontSize:10, color:C.lg }}>Your Mentor</p></div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Link to="/student/sessions/all" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"9px 0", background:`linear-gradient(135deg,${C.blue},${C.primary})`, color:"#fff", borderRadius:9, fontSize:12, fontWeight:700, textDecoration:"none" }}>Sessions <ChevronRight size={12}/></Link>
          <Link to="/student/syllabus" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"9px 0", background:"#eff8ff", color:C.primary, borderRadius:9, fontSize:12, fontWeight:700, textDecoration:"none", border:"1px solid #bfdbfe" }}>Syllabus <ChevronRight size={12}/></Link>
        </div>
      </div>
    </motion.div>
  );
}

const FREE = [
  { icon:"⚙", title:"CATIA Tool for Beginners", sessions:10, duration:"2hrs 50mins" },
  { icon:"🔧", title:"UG NX Tool for Beginners", sessions:10, duration:"2hrs 50mins" },
  { icon:"🏭", title:"Mould Design Fundamentals", sessions:8, duration:"2hrs 10mins" },
];

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    batchApi.enrolled()
      .then(res => setEnrollments(res.data || []))
      .catch(e  => setError(e.message || "Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageWrapper>
        {/* Referral banner */}
        <motion.div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{ background:"linear-gradient(135deg,#024981,#007BBF)" }}
          initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
          <div style={{ position:"absolute", right:-28, top:-28, width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <h2 style={{ color:"#fff", fontWeight:700, fontSize:17, marginBottom:4 }}>
            Refer and <span style={{ color:"#fde047", textDecoration:"underline" }}>Earn ₹500</span> Cash points.
          </h2>
          <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginBottom:16 }}>Feel free to recommend your friend</p>
          <button style={{ background:"#1E2023", color:"#fff", fontSize:13, fontWeight:700, padding:"10px 20px", borderRadius:12, border:"none", cursor:"pointer" }}>Get Reward</button>
        </motion.div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-dct-dark">My Courses</h2>
          {!loading && enrollments.length > 0 && <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:32 }}>
            {[1,2,3].map(i=>(
              <div key={i} style={{ height:360, background:"#f3f4f6", borderRadius:16 }} className="animate-pulse"/>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
            <p className="text-red-600 font-semibold mb-3">{error}</p>
            <button onClick={()=>window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && enrollments.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center mb-8" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="font-bold text-dct-dark mb-1">No courses enrolled yet</p>
            <p className="text-sm text-dct-lightgray mb-5">Browse our courses and enroll to start learning.</p>
            <Link to="/" className="inline-block px-6 py-2.5 text-white text-sm font-bold rounded-xl" style={{ background:`linear-gradient(135deg,${C.blue},${C.primary})` }}>Browse Courses</Link>
          </div>
        )}

        {/* Course cards */}
        {!loading && !error && enrollments.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:32 }}>
            {enrollments.map((e,i)=><CourseCard key={e.enrollment_id||i} enrollment={e} index={i}/>)}
          </div>
        )}

        {/* Free courses */}
        <h2 className="text-xl font-bold text-dct-dark mb-4">Explore These Free Courses</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
          {FREE.map((c,i)=>(
            <motion.div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 relative"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3, delay:0.4+i*0.07 }} whileHover={{ y:-2 }}
              style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:28 }}>{c.icon}</span>
                <span style={{ background:"#FFE8EE", color:"#F8285A", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999 }}>Free</span>
              </div>
              <h3 className="font-bold text-sm text-dct-dark mb-3 leading-snug">{c.title}</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><p className="text-sm font-bold text-dct-dark">{c.sessions} Sessions</p><p className="text-xs text-dct-lightgray">No. of Sessions</p></div>
                <div><p className="text-sm font-bold text-dct-dark">{c.duration}</p><p className="text-xs text-dct-lightgray">Duration</p></div>
              </div>
              <button className="w-full bg-dct-primary hover:bg-dct-blue text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">View Course</button>
            </motion.div>
          ))}
        </div>

      </PageWrapper>
    </AppShell>
  );
}
