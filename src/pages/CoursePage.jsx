/**
 * CoursePage.jsx — Universal Course Page Component
 * Used by all 3 courses via different routes
 * Mobile-first, conversion-optimised, trust-building
 * Matches DCT brand: navy #08072D, blue #0D92DB, blue2 #037EC4, lightBg #E5F2F9
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

const C = {
  navy: "#08072D", blue: "#0D92DB", blue2: "#037EC4",
  blue4: "#024981", lightBg: "#E5F2F9", dark: "#1E2023",
  gray: "#535457", gray2: "#9C9A9A", yellow: "#FFEB3A",
  white: "#FFFFFF",
};

// ── Course Data ────────────────────────────────────────────
const COURSES = {
  "plastic-product-design": {
    slug: "plastic-product-design",
    name: "Plastic Product Design",
    tagline: "From Zero to Industry-Ready in 4 Months",
    badge: "🏆 Most Popular",
    badgeBg: C.yellow,
    badgeColor: "#1C1C1C",
    price: 18000,
    slashPrice: 24000,
    discount: "25% OFF",
    rating: "4.9",
    reviews: "312",
    enrolled: "312+",
    duration: "4 Months",
    sessions: "40+",
    projects: "11",
    accentColor: "#037EC4",
    heroGradient: "linear-gradient(135deg,#08072D 0%,#0a1a35 60%,#0d2a50 100%)",
    heroIcon: "⚙",
    tools: ["CATIA V5", "GSD Surfacing", "Mould Design", "GD&T", "Draft Analysis"],
    tutor: {
      name: "Balkrishna Dhuri",
      exp: "12 Years Experience",
      companies: "Ex-Bajaj Auto & L&T",
      initial: "B",
    },
    outcomes: [
      "Design complete plastic parts in CATIA V5 from scratch",
      "Apply Class A surfacing and generative shape design",
      "Create full mould designs with core, cavity, sliders & lifters",
      "Analyse draft, wall thickness, sink marks like a pro",
      "Build a portfolio of 11 real automotive industry projects",
      "Clear technical interviews at Tier-1 automotive companies",
    ],
    includes: [
      { icon: "📹", label: "40+ Live Sessions", sub: "Recordings available within 2 hours" },
      { icon: "🏭", label: "11 Industry Projects", sub: "3 live mentored + 8 self-paced" },
      { icon: "📜", label: "Govt. Certificate", sub: "Recognised by top recruiters" },
      { icon: "💼", label: "Placement Support", sub: "Referrals to 50+ companies" },
      { icon: "❓", label: "Doubt Support", sub: "24-hour tutor response" },
      { icon: "♾", label: "Lifetime Access", sub: "All recordings, forever" },
    ],
    syllabus: [
      { phase: "Phase 1 — Foundation (Days 1–30)", sessions: "Sessions 1–10", topics: ["CATIA V5 interface & workbenches","Sketcher & Part Design basics","GD&T and 2D drawing standards","Assembly Design & constraints","Plastic design rules & wall thickness"] },
      { phase: "Phase 2 — Advanced Design (Days 31–60)", sessions: "Sessions 11–22", topics: ["Generative Shape Design (GSD)","Class A Surfacing techniques","Draft analysis & mould feasibility","Core & cavity extraction","Slider & lifter design"] },
      { phase: "Phase 3 — Mould Design (Days 61–85)", sessions: "Sessions 23–32", topics: ["Mould base layout & standards","Gate, runner & cooling channel design","Ejector system design","Mould simulation preparation","Real mould documentation"] },
      { phase: "Phase 4 — Industry Projects (Days 86–120)", sessions: "Sessions 33–40", topics: ["Live Project 1: Door Trim Panel complete mould","Live Project 2: Dashboard Cup Holder","Live Project 3: Interior Armrest Assembly","8 Recorded practice projects","Portfolio preparation & interview coaching"] },
    ],
    projects: [
      { name: "Automotive Door Trim Panel", type: "LIVE", difficulty: "Advanced" },
      { name: "Dashboard Cup Holder", type: "LIVE", difficulty: "Intermediate" },
      { name: "Interior Armrest Assembly", type: "LIVE", difficulty: "Advanced" },
      { name: "B-Pillar Interior Cover", type: "Practice", difficulty: "Intermediate" },
      { name: "Glove Box Shell", type: "Practice", difficulty: "Intermediate" },
      { name: "HVAC Air Vent", type: "Practice", difficulty: "Intermediate" },
      { name: "Door Mirror Housing", type: "Practice", difficulty: "Advanced" },
      { name: "Steering Column Cover", type: "Practice", difficulty: "Beginner" },
      { name: "Center Console Insert", type: "Practice", difficulty: "Advanced" },
      { name: "Rear Spoiler Panel", type: "Practice", difficulty: "Advanced" },
      { name: "Switch Bezel Component", type: "Practice", difficulty: "Beginner" },
    ],
    faqs: [
      { q: "Do I need prior CAD experience?", a: "No. We start from absolute zero — CATIA interface, basic tools, sketching — and build up to full mould design. Many of our placed students had never opened CATIA before joining." },
      { q: "What software do I need?", a: "CATIA V5. We guide you through installation and provide student licence guidance. A mid-range laptop (8GB RAM, Intel i5 or above) is sufficient." },
      { q: "How many hours per week?", a: "3 live sessions per week (Mon/Wed/Fri, 1.5 hrs each) + 4–6 hours of self-practice and assignments. Designed for working professionals." },
      { q: "Are sessions recorded?", a: "Yes. Every session is recorded and available in your portal within 2 hours. You have lifetime access to all recordings." },
      { q: "Is placement guaranteed?", a: "We provide 100% placement assistance — resume review, mock interviews, and referrals to our network of 50+ hiring partners. 312 students placed so far." },
      { q: "Can I pay in EMI?", a: "Yes. We support EMI options. Contact us on WhatsApp at +91 1234567890 to discuss EMI plans that suit you." },
    ],
    placements: ["ALSTOM","TATA ELXSI","Bajaj Auto","L&T","Wipro","Capgemini","FORCE MOTORS","Mahindra"],
  },

  "biw-product-design": {
    slug: "biw-product-design",
    name: "BIW Product Design",
    tagline: "Master Automotive Body-in-White Design",
    badge: "🚀 Industry Favourite",
    badgeBg: C.blue2,
    badgeColor: "#fff",
    price: 18000,
    slashPrice: 22000,
    discount: "18% OFF",
    rating: "4.8",
    reviews: "198",
    enrolled: "198+",
    duration: "4 Months",
    sessions: "35+",
    projects: "8",
    accentColor: "#037EC4",
    heroGradient: "linear-gradient(135deg,#08072D 0%,#0a1a35 60%,#0d2a50 100%)",
    heroIcon: "🚗",
    tools: ["CATIA V5 BIW", "Assembly Design", "Weld Joint Analysis", "GD&T", "DMU Kinematics"],
    tutor: {
      name: "Priya Joshi",
      exp: "10 Years Experience",
      companies: "Ex-TATA Motors & Mahindra",
      initial: "P",
    },
    outcomes: [
      "Design BIW components used in real automotive production",
      "Apply welding standards, joint design and structural principles",
      "Work with CATIA BIW workbench tools professionally",
      "Understand automotive design for manufacturability (DFM)",
      "Build a portfolio of 8 real BIW industry projects",
      "Get placed at Tier-1 automotive companies across India",
    ],
    includes: [
      { icon: "📹", label: "35+ Live Sessions", sub: "Recordings available within 2 hours" },
      { icon: "🏭", label: "8 Industry Projects", sub: "Real BIW automotive parts" },
      { icon: "📜", label: "Govt. Certificate", sub: "Recognised by top recruiters" },
      { icon: "💼", label: "Placement Support", sub: "Referrals to 50+ companies" },
      { icon: "❓", label: "Doubt Support", sub: "24-hour tutor response" },
      { icon: "♾", label: "Lifetime Access", sub: "All recordings, forever" },
    ],
    syllabus: [
      { phase: "Phase 1 — Automotive Fundamentals (Days 1–30)", sessions: "Sessions 1–9", topics: ["BIW structure & automotive architecture","CATIA V5 BIW workbench tools","Sheet metal fundamentals & standards","Weld joint types and selection","GD&T for automotive components"] },
      { phase: "Phase 2 — BIW Component Design (Days 31–65)", sessions: "Sessions 10–22", topics: ["Floor pan & side member design","A-pillar, B-pillar, C-pillar design","Door inner & outer panel design","Roof panel & reinforcement design","Structural analysis for weight optimisation"] },
      { phase: "Phase 3 — Assembly & Joints (Days 66–90)", sessions: "Sessions 23–30", topics: ["BIW full body assembly","Weld flange and hem design","Sealing & adhesive locations","Hinge design and door movement study","DMU kinematics for door/hood motion"] },
      { phase: "Phase 4 — Industry Projects (Days 91–120)", sessions: "Sessions 31–35", topics: ["Project 1: Full door assembly complete BIW","Project 2: Front floor pan with cross-members","Project 3: Tailgate inner structure","5 Practice projects with expert review","Placement preparation & portfolio building"] },
    ],
    projects: [
      { name: "Front Door Full Assembly", type: "LIVE", difficulty: "Advanced" },
      { name: "Front Floor Pan", type: "LIVE", difficulty: "Advanced" },
      { name: "Tailgate Inner Structure", type: "LIVE", difficulty: "Intermediate" },
      { name: "B-Pillar Reinforcement", type: "Practice", difficulty: "Intermediate" },
      { name: "Roof Rail Component", type: "Practice", difficulty: "Intermediate" },
      { name: "Sill Panel Design", type: "Practice", difficulty: "Beginner" },
      { name: "Hood Inner Panel", type: "Practice", difficulty: "Advanced" },
      { name: "Fender Assembly", type: "Practice", difficulty: "Intermediate" },
    ],
    faqs: [
      { q: "Do I need automotive background?", a: "No. We explain automotive architecture from scratch. You need basic mechanical engineering understanding (diploma or degree level)." },
      { q: "Which software is used?", a: "CATIA V5 with BIW workbench. A standard laptop with 8GB RAM, i5 or above is sufficient." },
      { q: "What companies hire BIW designers?", a: "TATA Motors, Mahindra, Maruti Suzuki, Force Motors, TATA ELXSI, Capgemini Engineering, SEGULA Technologies, and 50+ more in our placement network." },
      { q: "Are sessions live or recorded?", a: "All sessions are live + recorded. Recordings are in your portal within 2 hours. You have lifetime access." },
      { q: "What is the salary range after placement?", a: "Our placed students get between ₹3.5 LPA to ₹6 LPA depending on the company and location. Most freshers start at ₹4–5 LPA." },
      { q: "What if I miss a session?", a: "No problem. Every session is recorded. You can watch at your own pace and ask questions on the portal anytime." },
    ],
    placements: ["TATA Motors","Mahindra","SEGULA","Capgemini","TATA ELXSI","Force Motors","Wipro","L&T"],
  },

  "ug-nx-product-design": {
    slug: "ug-nx-product-design",
    name: "UG NX Product Design",
    tagline: "Industry-Ready NX Training in 3 Months",
    badge: "⚡ New Batch Open",
    badgeBg: "#FF6B2B",
    badgeColor: "#fff",
    price: 15000,
    slashPrice: 20000,
    discount: "25% OFF",
    rating: "4.7",
    reviews: "87",
    enrolled: "87+",
    duration: "3 Months",
    sessions: "30+",
    projects: "7",
    accentColor: "#037EC4",
    heroGradient: "linear-gradient(135deg,#08072D 0%,#0a1a35 60%,#0d2a50 100%)",
    heroIcon: "🔧",
    tools: ["Siemens NX", "Sync. Modelling", "Assembly", "Drafting", "CAM Basics"],
    tutor: {
      name: "Rahul Sharma",
      exp: "9 Years Experience",
      companies: "Ex-John Deere & KPIT",
      initial: "R",
    },
    outcomes: [
      "Master Siemens NX interface and all core modelling tools",
      "Apply synchronous modelling for rapid design changes",
      "Create complex assemblies and manage large product structures",
      "Generate manufacturing-ready technical drawings",
      "Build 7 real industry product design projects",
      "Get placed at companies using Siemens NX across India",
    ],
    includes: [
      { icon: "📹", label: "30+ Live Sessions", sub: "Recordings available within 2 hours" },
      { icon: "🏭", label: "7 Industry Projects", sub: "Real product design parts" },
      { icon: "📜", label: "Govt. Certificate", sub: "Recognised by top recruiters" },
      { icon: "💼", label: "Placement Support", sub: "Referrals to hiring companies" },
      { icon: "❓", label: "Doubt Support", sub: "24-hour tutor response" },
      { icon: "♾", label: "Lifetime Access", sub: "All recordings, forever" },
    ],
    syllabus: [
      { phase: "Phase 1 — NX Fundamentals (Days 1–30)", sessions: "Sessions 1–10", topics: ["Siemens NX interface & customisation","Sketch & constraint-based modelling","Extrude, revolve, sweep & complex features","Synchronous modelling techniques","Assembly constraints & motion"] },
      { phase: "Phase 2 — Advanced Modelling (Days 31–60)", sessions: "Sessions 11–22", topics: ["Surface modelling & sheet body tools","Free form feature design","Large assembly management strategies","Product manufacturing information (PMI)","Technical drawing & GD&T in NX"] },
      { phase: "Phase 3 — Industry Projects (Days 61–90)", sessions: "Sessions 23–30", topics: ["Project 1: Engine bracket complete assembly","Project 2: Agricultural equipment housing","Project 3: Industrial pump casing design","4 Practice projects with review","Portfolio preparation and interview coaching"] },
    ],
    projects: [
      { name: "Engine Mounting Bracket", type: "LIVE", difficulty: "Advanced" },
      { name: "Agricultural Equipment Housing", type: "LIVE", difficulty: "Intermediate" },
      { name: "Industrial Pump Casing", type: "LIVE", difficulty: "Advanced" },
      { name: "Gearbox Cover Design", type: "Practice", difficulty: "Intermediate" },
      { name: "Hydraulic Valve Body", type: "Practice", difficulty: "Advanced" },
      { name: "Bearing Housing", type: "Practice", difficulty: "Beginner" },
      { name: "Sheet Metal Enclosure", type: "Practice", difficulty: "Intermediate" },
    ],
    faqs: [
      { q: "Is NX better than CATIA?", a: "Both are industry-standard tools. NX is heavily used in manufacturing, heavy engineering, and agricultural equipment sectors. Many companies in Pune, Bangalore and Chennai actively hire NX designers." },
      { q: "Do I need prior CAD experience?", a: "Basic mechanical understanding helps but is not mandatory. We start from scratch. Prior CATIA or SolidWorks experience will help you progress faster." },
      { q: "What hardware do I need?", a: "A laptop with 8GB RAM (16GB recommended), Intel i5/i7, and dedicated graphics card. We share installation support and student licence guidance." },
      { q: "Are sessions recorded?", a: "Yes, all sessions are recorded and available in your portal within 2 hours. Lifetime access included." },
      { q: "Which companies hire NX designers?", a: "John Deere, KPIT, Mahindra, Tata Technologies, Larsen & Toubro, Bajaj Auto, and several Tier-1 auto suppliers actively hire Siemens NX designers." },
      { q: "How is this different from YouTube tutorials?", a: "Real industry projects, personalised feedback, doubt clearing sessions, placement referrals, and a government certificate. YouTube can't give you any of those." },
    ],
    placements: ["John Deere","KPIT","Mahindra","L&T","Bajaj Auto","TATA Technologies","Wipro","SEGULA"],
  },
};

// ── Sticky CTA Bar ─────────────────────────────────────────
function StickyCTA({ course, onEnroll }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  if (!show) return null;
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"#fff", borderTop:"2px solid #e8ecf0", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, boxShadow:"0 -4px 24px rgba(0,0,0,0.12)" }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.dark, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{course.name}</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:C.dark }}>₹{course.price.toLocaleString("en-IN")}</span>
          <span style={{ fontSize:13, color:C.gray2, textDecoration:"line-through" }}>₹{course.slashPrice.toLocaleString("en-IN")}</span>
        </div>
      </div>
      <button onClick={onEnroll} style={{ flexShrink:0, padding:"13px 28px", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", boxShadow:`0 4px 16px rgba(3,126,196,0.4)`, whiteSpace:"nowrap" }}>
        Register Now →
      </button>
    </div>
  );
}

// ── Main CoursePage ────────────────────────────────────────
export default function CoursePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const course   = COURSES[slug];
  const [openFaq, setOpenFaq]         = useState(null);
  const [openSyllabus, setOpenSyllabus] = useState([0]);
  const heroRef = useRef(null);

  if (!course) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:"'Barlow',sans-serif", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:48 }}>🔍</div>
        <h2 style={{ fontSize:24, fontWeight:700, color:C.dark }}>Course not found</h2>
        <button onClick={() => navigate("/")} style={{ padding:"12px 24px", background:C.blue2, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'Barlow',sans-serif", fontSize:15, fontWeight:600 }}>← Back to Home</button>
      </div>
    );
  }

  const handleEnroll = () => navigate(`/auth/register?course=${course.slug}`);
  const toggleFaq = i => setOpenFaq(openFaq === i ? null : i);
  const toggleSyllabus = i => setOpenSyllabus(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const disc = Math.round(((course.slashPrice - course.price) / course.slashPrice) * 100);

  return (
    <div style={{ fontFamily:"'Barlow',sans-serif", color:C.dark, background:"#fff", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes liveDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.4)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .enroll-btn:hover{transform:translateY(-2px)!important;box-shadow:0 12px 36px rgba(3,126,196,0.5)!important}
        .enroll-btn-white:hover{background:#f0f7ff!important;transform:translateY(-2px)!important}
        .course-nav-link:hover{color:#0D92DB!important}
        .faq-q:hover{color:#037EC4!important}
        .project-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.1)!important}
        .include-card:hover{border-color:#037EC4!important;background:#f0f8ff!important}
        .outcome-item{animation:fadeUp 0.5s ease forwards;opacity:0}
        ${[1,2,3,4,5,6].map(i=>.outcome-item:nth-child(${i}){animation-delay:${i*0.08}s}).join("")}
        @media(max-width:768px){
          .course-hero-grid{flex-direction:column!important}
          .course-sidebar{position:static!important;width:100%!important;max-width:100%!important;margin-bottom:24px}
          .course-main{padding-right:0!important}
          .includes-grid{grid-template-columns:1fr 1fr!important}
          .outcomes-grid{grid-template-columns:1fr!important}
          .projects-grid{grid-template-columns:1fr 1fr!important}
          .trust-bar{flex-wrap:wrap!important;gap:12px!important;justify-content:flex-start!important}
          .placement-grid{grid-template-columns:repeat(3,1fr)!important;gap:8px!important}
          .tools-row{flex-wrap:wrap!important}
          .hero-btns-row{flex-direction:column!important}
          .hero-btns-row .enroll-btn,.hero-btns-row .enroll-btn-white{width:100%!important;text-align:center!important;justify-content:center!important}
          .faq-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .includes-grid{grid-template-columns:1fr!important}
          .projects-grid{grid-template-columns:1fr!important}
          .placement-grid{grid-template-columns:1fr 1fr!important}
          .course-hero-inner{padding:28px 20px 32px!important}
          .section-inner{padding:40px 16px!important}
          .course-sidebar-inner{padding:20px!important}
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ background:"#fff", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", borderBottom:"1px solid #e8ecf0", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <button onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:10, background:"none", border:"none", cursor:"pointer", fontFamily:"'Barlow',sans-serif" }}>
          <div style={{ width:38, height:38, borderRadius:9, background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, color:"#fff" }}>D</div>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#0D0D0D", letterSpacing:"1.5px", lineHeight:1.2 }}>DIGITAL</div>
            <div style={{ fontSize:7, fontWeight:500, color:"#666", letterSpacing:"3px", textTransform:"uppercase" }}>CAD TRAINING</div>
          </div>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={() => navigate("/")} style={{ fontSize:13, fontWeight:500, color:C.gray, background:"none", border:"none", cursor:"pointer", fontFamily:"'Barlow',sans-serif" }} className="course-nav-link">← All Courses</button>
          <button onClick={handleEnroll} className="enroll-btn" style={{ padding:"10px 20px", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", transition:"all 0.2s" }}>Register Now</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ background:course.heroGradient, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)", backgroundSize:"44px 44px", pointerEvents:"none" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 10% 80%,rgba(13,146,219,0.18),transparent 55%)", pointerEvents:"none" }} />

        <div className="course-hero-inner" style={{ maxWidth:1200, margin:"0 auto", padding:"40px 24px 48px", position:"relative", zIndex:1 }}>
          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20, flexWrap:"wrap" }}>
            <button onClick={()=>navigate("/")} style={{ color:"rgba(255,255,255,0.5)", background:"none", border:"none", cursor:"pointer", fontSize:13, fontFamily:"'Barlow',sans-serif" }}>Home</button>
            <span>›</span><span style={{ color:"rgba(255,255,255,0.5)" }}>Courses</span>
            <span>›</span><span style={{ color:"rgba(255,255,255,0.85)", fontWeight:600 }}>{course.name}</span>
          </div>

          <div className="course-hero-grid" style={{ display:"flex", gap:40, alignItems:"flex-start" }}>
            {/* LEFT content */}
            <div className="course-main" style={{ flex:1, minWidth:0, paddingRight:8 }}>
              {/* Badge */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:6, fontSize:12, fontWeight:700, background:course.badgeBg, color:course.badgeColor, marginBottom:18, letterSpacing:0.3 }}>
                {course.badge}
              </div>

              <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(28px,4.5vw,54px)", fontWeight:800, color:"#fff", lineHeight:1.05, marginBottom:12, letterSpacing:"-0.5px" }}>
                {course.name}<br/>
                <span style={{ color:C.blue, fontSize:"0.75em" }}>{course.tagline}</span>
              </h1>

              <p style={{ fontSize:"clamp(13px,1.2vw,16px)", color:"rgba(255,255,255,0.75)", lineHeight:1.7, maxWidth:580, marginBottom:24 }}>
                Learn from industry experts with {course.tutor.exp.toLowerCase()} at top companies. Real projects, live sessions, and guaranteed placement support.
              </p>

              {/* Rating row */}
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:C.yellow }}>{course.rating}</span>
                  <span style={{ color:"#FFC107", fontSize:16, letterSpacing:2 }}>★★★★★</span>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>({course.reviews} reviews)</span>
                </div>
                <div style={{ width:1, height:18, background:"rgba(255,255,255,0.2)" }} />
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>👥 {course.enrolled} students enrolled</span>
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#4ade80", fontWeight:600 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"liveDot 2s infinite" }} />
                  April 2025 Batch Open
                </div>
              </div>

              {/* Quick stats pills */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:28 }}>
                {[
                  [`🕐 ${course.duration}`, "Duration"],
                  [`📹 ${course.sessions} Sessions`, "Live + Recorded"],
                  [`🏭 ${course.projects} Projects`, "Industry Level"],
                  ["📜 Certificate", "Govt. Recognised"],
                  ["💼 Placement", "100% Support"],
                ].map(([val, sub]) => (
                  <div key={val} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 14px", fontSize:12, color:"rgba(255,255,255,0.9)", fontWeight:600 }}>
                    {val}<br/><span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:400 }}>{sub}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="hero-btns-row" style={{ display:"flex", gap:12, marginBottom:28 }}>
                <button onClick={handleEnroll} className="enroll-btn" style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 32px", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", boxShadow:"0 8px 24px rgba(3,126,196,0.4)", transition:"all 0.2s" }}>
                  Register Now — ₹{course.price.toLocaleString("en-IN")} →
                </button>
                <button onClick={() => document.getElementById("syllabus")?.scrollIntoView({behavior:"smooth"})} className="enroll-btn-white" style={{ display:"flex", alignItems:"center", gap:8, padding:"15px 24px", background:"rgba(255,255,255,0.1)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'Barlow',sans-serif", transition:"all 0.2s", backdropFilter:"blur(8px)" }}>
                  View Syllabus
                </button>
              </div>

              {/* Tools row */}
              <div className="tools-row" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginRight:4 }}>Tools covered:</span>
                {course.tools.map(t => (
                  <span key={t} style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.8)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", padding:"4px 10px", borderRadius:20 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* RIGHT sidebar card (desktop) */}
            <div className="course-sidebar" style={{ width:340, flexShrink:0, position:"sticky", top:80 }}>
              <div className="course-sidebar-inner" style={{ background:"#fff", borderRadius:18, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
                {/* Discount banner */}
                <div style={{ background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, padding:"14px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.75)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Limited Batch Offer</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:C.yellow }}>Save ₹{(course.slashPrice - course.price).toLocaleString("en-IN")} — {course.discount}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginTop:2 }}>Offer valid for April 2025 batch</div>
                </div>

                <div style={{ padding:24 }}>
                  {/* Price */}
                  <div style={{ textAlign:"center", marginBottom:18 }}>
                    <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:44, fontWeight:800, color:C.dark }}>₹{course.price.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                      <span style={{ fontSize:17, color:C.gray2, textDecoration:"line-through" }}>₹{course.slashPrice.toLocaleString("en-IN")}</span>
                      <span style={{ background:"#dcfce7", color:"#166534", fontSize:13, fontWeight:700, padding:"3px 10px", borderRadius:6 }}>{disc}% OFF</span>
                    </div>
                    <div style={{ fontSize:12, color:C.gray2, marginTop:8 }}>One-time payment · EMI available</div>
                  </div>

                  {/* Batch info */}
                  <div style={{ background:C.lightBg, borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:C.blue4, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>April 2025 Batch</div>
                    {[["📅 Starts","1st April 2025"],["⏱ Duration",course.duration],["📹 Sessions",`${course.sessions} Live + Recorded`],["🕐 Timing","Mon/Wed/Fri · 8–9:30 PM"],["👥 Batch Size","Max 25 Students"],["💺 Seats Left","12 remaining"]].map(([l,v])=>(
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", fontSize:13, marginBottom:8, paddingBottom:8, borderBottom:"1px solid rgba(0,0,0,0.06)", gap:8 }}>
                        <span style={{ color:C.gray, flexShrink:0 }}>{l}</span>
                        <span style={{ fontWeight:700, color:C.dark, textAlign:"right" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                      <span style={{ color:C.gray }}>💺 Seats Left</span>
                      <span style={{ fontWeight:700, color:"#dc2626" }}>12 of 25 remaining</span>
                    </div>
                  </div>

                  {/* Register button */}
                  <button onClick={handleEnroll} className="enroll-btn" style={{ display:"block", width:"100%", padding:"16px 0", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", marginBottom:10, transition:"all 0.2s", boxShadow:`0 8px 24px rgba(3,126,196,0.35)` }}>
                    Register Now — Secure Seat →
                  </button>
                  <button onClick={() => document.getElementById("syllabus")?.scrollIntoView({behavior:"smooth"})} style={{ display:"block", width:"100%", padding:"13px 0", background:"transparent", color:C.blue2, border:`2px solid ${C.blue2}`, borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", marginBottom:16, transition:"background 0.2s" }} onMouseEnter={e=>e.target.style.background=C.lightBg} onMouseLeave={e=>e.target.style.background="transparent"}>
                    View Full Syllabus
                  </button>

                  <p style={{ fontSize:12, color:C.gray2, textAlign:"center", lineHeight:1.6 }}>
                    🔒 Secure payment · 7-day refund policy<br/>
                    📞 <a href="tel:+911234567890" style={{ color:C.blue2, fontWeight:600 }}>+91 1234567890</a> for help
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, padding:"16px 24px" }}>
        <div className="trust-bar" style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          {[["312+","Students Placed"],["50+","Hiring Companies"],["4.9★","Average Rating"],["100%","Placement Support"],["Govt.","Certificate"]].map(([val,label])=>(
            <div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:"#fff" }}>{val}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.75)", fontWeight:600 }}>{label}</span>
              <span style={{ width:1, height:24, background:"rgba(255,255,255,0.25)", marginLeft:4 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── WHAT YOU'LL LEARN ── */}
      <section style={{ padding:"60px 0", background:"#fff" }}>
        <div className="section-inner" style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"start" }}>
            <div>
              <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(26px,3vw,40px)", fontWeight:800, color:C.dark, marginBottom:8, letterSpacing:"-0.3px" }}>What You'll Learn</h2>
              <p style={{ fontSize:15, color:C.gray, marginBottom:24, lineHeight:1.7 }}>Skills you'll apply from day one at any top company:</p>
              <ul className="outcomes-grid" style={{ listStyle:"none", display:"grid", gridTemplateColumns:"1fr", gap:12 }}>
                {course.outcomes.map((o, i) => (
                  <li key={i} className="outcome-item" style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", background:C.lightBg, borderRadius:10, border:"1px solid #d0e8f5" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0, marginTop:2 }}><path d="M3 9.5L7 13.5L15 5" stroke={C.blue2} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize:14, color:C.dark, lineHeight:1.5 }}>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What's included */}
            <div>
              <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(26px,3vw,40px)", fontWeight:800, color:C.dark, marginBottom:8, letterSpacing:"-0.3px" }}>What's Included</h2>
              <p style={{ fontSize:15, color:C.gray, marginBottom:24, lineHeight:1.7 }}>Everything you get with this course:</p>
              <div className="includes-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {course.includes.map((inc, i) => (
                  <div key={i} className="include-card" style={{ display:"flex", gap:12, padding:"14px", border:"1.5px solid #e8ecf0", borderRadius:12, background:"#fff", transition:"all 0.2s", cursor:"default" }}>
                    <span style={{ fontSize:24, flexShrink:0 }}>{inc.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:2 }}>{inc.label}</div>
                      <div style={{ fontSize:11, color:C.gray2 }}>{inc.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleEnroll} className="enroll-btn" style={{ marginTop:24, width:"100%", padding:"16px 0", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", transition:"all 0.2s", boxShadow:`0 6px 20px rgba(3,126,196,0.35)` }}>
                Register Now — Get Full Access →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TUTOR ── */}
      <section style={{ background:C.lightBg, padding:"52px 0" }}>
        <div className="section-inner" style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(26px,3vw,38px)", fontWeight:800, color:C.dark, marginBottom:28, letterSpacing:"-0.3px" }}>Your Industry Expert Tutor</h2>
          <div style={{ background:"#fff", borderRadius:18, padding:"28px", display:"flex", alignItems:"center", gap:28, boxShadow:"0 4px 24px rgba(0,0,0,0.07)", flexWrap:"wrap" }}>
            <div style={{ width:100, height:100, borderRadius:"50%", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, fontWeight:800, color:"#fff", flexShrink:0 }}>{course.tutor.initial}</div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800, color:C.dark, marginBottom:4 }}>{course.tutor.name}</div>
              <div style={{ fontSize:14, color:C.blue4, fontWeight:600, marginBottom:8 }}>{course.name} Specialist · {course.tutor.exp}</div>
              <div style={{ fontSize:13, color:C.gray, lineHeight:1.7, marginBottom:14 }}>
                {course.tutor.companies}. Specialises in real-world {course.name.toLowerCase()} with hands-on project experience across 100+ production designs. All sessions are practical, tool-focused, and relevant to current industry standards.
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {[course.tutor.exp, course.tutor.companies, "Government Certified Trainer", `${course.reviews}+ Students Trained`].map(t => (
                  <span key={t} style={{ background:C.lightBg, color:C.blue4, fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:6 }}>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={handleEnroll} className="enroll-btn" style={{ flexShrink:0, padding:"14px 28px", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", transition:"all 0.2s" }}>
              Register Now →
            </button>
          </div>
        </div>
      </section>

      {/* ── SYLLABUS ── */}
      <section id="syllabus" style={{ background:"#fff", padding:"60px 0" }}>
        <div className="section-inner" style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(26px,3vw,40px)", fontWeight:800, color:C.dark, marginBottom:10 }}>Complete Course Syllabus</h2>
            <p style={{ fontSize:15, color:C.gray, maxWidth:520, margin:"0 auto" }}>
              {course.sessions} sessions across {course.syllabus.length} phases — from beginner to industry-ready in {course.duration}.
            </p>
            <div style={{ display:"flex", justifyContent:"center", gap:32, marginTop:20, flexWrap:"wrap" }}>
              {[[`${course.sessions}+`,"Live Sessions"],[course.syllabus.length,"Phases"],[course.duration,"Duration"],[`${course.projects}+`,"Projects"]].map(([v,l])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:30, fontWeight:800, color:C.blue4 }}>{v}</div>
                  <div style={{ fontSize:12, color:C.gray }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:32 }}>
            {course.syllabus.map((phase, i) => (
              <div key={i} style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e8ecf0", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
                <button onClick={() => toggleSyllabus(i)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", background:"none", border:"none", cursor:"pointer", fontFamily:"'Barlow',sans-serif", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, textAlign:"left", flex:1, minWidth:0 }}>
                    <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800, color:"#fff", flexShrink:0 }}>{i+1}</div>
                    <div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:800, color:C.dark, lineHeight:1.3 }}>{phase.phase}</div>
                      <div style={{ fontSize:12, color:C.gray, marginTop:2 }}>{phase.sessions}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:22, color:C.gray, transform:openSyllabus.includes(i)?"rotate(45deg)":"none", transition:"transform 0.3s", flexShrink:0 }}>+</span>
                </button>
                {openSyllabus.includes(i) && (
                  <div style={{ padding:"0 22px 20px" }}>
                    <div style={{ height:1, background:"#e8ecf0", marginBottom:16 }} />
                    <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:10 }}>
                      {phase.topics.map((topic, j) => (
                        <li key={j} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:14, color:C.dark, lineHeight:1.5 }}>
                          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0, marginTop:3 }}><path d="M3 9.5L7 13.5L15 5" stroke={C.blue2} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign:"center" }}>
            <button onClick={handleEnroll} className="enroll-btn" style={{ padding:"16px 48px", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", transition:"all 0.2s", boxShadow:`0 6px 20px rgba(3,126,196,0.35)` }}>
              Register Now and Start Learning →
            </button>
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section style={{ background:C.lightBg, padding:"56px 0" }}>
        <div className="section-inner" style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(26px,3vw,40px)", fontWeight:800, color:C.dark, marginBottom:10 }}>{course.projects} Industry Projects You'll Build</h2>
            <p style={{ fontSize:15, color:C.gray }}>Real projects that go in your portfolio and impress recruiters.</p>
          </div>
          <div className="projects-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
            {course.projects.map((p, i) => (
              <div key={i} className="project-card" style={{ background:"#fff", border:"1.5px solid #e8ecf0", borderRadius:12, padding:"16px 18px", boxShadow:"0 2px 10px rgba(0,0,0,0.04)", transition:"all 0.2s", borderLeft:`4px solid ${p.type==="LIVE"?"#16a34a":C.blue2}` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:4, background:p.type==="LIVE"?"#dcfce7":"#eff8ff", color:p.type==="LIVE"?"#166534":C.blue4 }}>{p.type === "LIVE" ? "🔴 LIVE Mentored" : "📹 Recorded"}</span>
                  <span style={{ fontSize:11, color:C.gray2 }}>{p.difficulty}</span>
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:C.dark, lineHeight:1.3 }}>{p.name}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center" }}>
            <button onClick={handleEnroll} className="enroll-btn" style={{ padding:"15px 36px", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", transition:"all 0.2s" }}>
              Register Now — Build Real Projects →
            </button>
          </div>
        </div>
      </section>

      {/* ── PLACEMENTS ── */}
      <section style={{ background:C.navy, padding:"52px 0" }}>
        <div className="section-inner" style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", textAlign:"center" }}>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(24px,3vw,38px)", fontWeight:800, color:"#fff", marginBottom:8 }}>Our Students Get Placed At</h2>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", marginBottom:32 }}>50+ hiring companies across India actively recruit from our batches</p>
          <div className="placement-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:32 }}>
            {course.placements.map(co => (
              <div key={co} style={{ background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"14px", textAlign:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.85)", letterSpacing:0.5 }}>{co}</div>
            ))}
          </div>
          <button onClick={handleEnroll} className="enroll-btn" style={{ padding:"16px 40px", background:`linear-gradient(135deg,${C.blue4},${C.blue2})`, color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'Barlow',sans-serif", transition:"all 0.2s", boxShadow:"0 8px 24px rgba(3,126,196,0.45)" }}>
            Register Now and Get Placed →
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background:"#fff", padding:"56px 0" }}>
        <div className="section-inner" style={{ maxWidth:900, margin:"0 auto", padding:"0 24px" }}>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(26px,3vw,38px)", fontWeight:800, color:C.dark, marginBottom:8, textAlign:"center" }}>Frequently Asked Questions</h2>
          <p style={{ fontSize:15, color:C.gray, textAlign:"center", marginBottom:32 }}>Everything you want to know before joining</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {course.faqs.map((faq, i) => (
              <div key={i} style={{ border:`1.5px solid ${openFaq===i?"#037EC4":"#e8ecf0"}`, borderRadius:12, overflow:"hidden", transition:"border-color 0.2s", boxShadow:openFaq===i?"0 4px 16px rgba(3,126,196,0.1)":"none" }}>
                <button className="faq-q" onClick={() => toggleFaq(i)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", background:openFaq===i?C.lightBg:"#fff", border:"none", cursor:"pointer", fontFamily:"'Barlow',sans-serif", fontSize:15, fontWeight:700, color:openFaq===i?C.blue4:C.dark, gap:12, textAlign:"left", transition:"all 0.2s" }}>
                  {faq.q}
                  <span style={{ fontSize:20, color:openFaq===i?C.blue2:C.gray, transform:openFaq===i?"rotate(45deg)":"none", transition:"transform 0.3s", flexShrink:0 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding:"0 20px 18px", background:C.lightBg, fontSize:14, color:C.gray, lineHeight:1.8 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background:`linear-gradient(135deg,${C.navy},${C.blue4})`, padding:"64px 24px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"44px 44px", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:700, margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,235,58,0.15)", border:"1px solid rgba(255,235,58,0.35)", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:700, color:C.yellow, marginBottom:18 }}>
            ⚡ Only 12 seats remaining in April 2025 batch
          </div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(30px,5vw,54px)", fontWeight:800, color:"#fff", lineHeight:1.05, marginBottom:14 }}>
            Start Your {course.name}<br/>Career Today
          </h2>
          <p style={{ fontSize:16, color:"rgba(255,255,255,0.75)", marginBottom:24, lineHeight:1.7 }}>
            Join {course.enrolled} students who built real industry skills and got placed at top companies.
          </p>
          {/* Price block */}
          <div style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"20px 28px", display:"inline-block", marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:12, marginBottom:6 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:44, fontWeight:800, color:"#fff" }}>₹{course.price.toLocaleString("en-IN")}</span>
              <span style={{ fontSize:18, color:"rgba(255,255,255,0.45)", textDecoration:"line-through" }}>₹{course.slashPrice.toLocaleString("en-IN")}</span>
              <span style={{ background:C.yellow, color:"#1a1a1a", fontSize:13, fontWeight:800, padding:"4px 12px", borderRadius:6 }}>SAVE ₹{(course.slashPrice-course.price).toLocaleString("en-IN")}</span>
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>One-time · Starts 1st April 2025 · 7-day refund policy</div>
          </div>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={handleEnroll} className="enroll-btn" style={{ padding:"18px 44px", background:"#fff", color:C.blue4, border:"none", borderRadius:12, fontSize:17, fontWeight:800, cursor:"pointer", fontFamily:"'Barlow',sans-serif", boxShadow:"0 8px 32px rgba(0,0,0,0.2)", transition:"all 0.2s" }}>
              Register Now — Secure Your Seat →
            </button>
            <a href="tel:+911234567890" style={{ padding:"17px 28px", background:"transparent", color:"#fff", border:"2px solid rgba(255,255,255,0.35)", borderRadius:12, fontSize:15, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}>
              📞 Call to Enroll
            </a>
          </div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:20 }}>
            Questions? Call <strong style={{ color:"rgba(255,255,255,0.75)" }}>+91 1234567890</strong> · Mon–Sat, 9 AM to 7 PM
          </p>
        </div>
      </section>

      {/* Sticky bottom bar */}
      <StickyCTA course={course} onEnroll={handleEnroll} />
    </div>
  );
}
