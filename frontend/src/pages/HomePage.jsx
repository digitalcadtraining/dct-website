import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ── DESIGN TOKENS ────────────────────────────────────────────
const C = {
  dark: "#0e0c0b", dark2: "#1a1612", dark3: "#241f1a",
  navy: "#003C6E", blue: "#024981", primary: "#007BBF",
  bright: "#1fa3e8", white: "#ffffff",
  gray: "#9ca3af", lg: "#6b7280", border: "rgba(255,255,255,0.08)",
};

// ── ANIMATION VARIANTS ───────────────────────────────────────
const fadeUp   = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } } };
const fadeLeft = { hidden: { opacity: 0, x: -28 }, show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } } };
const fadeRight= { hidden: { opacity: 0, x: 28  }, show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } } };
const stagger  = (i = 0) => ({ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 } } });

// ── REUSABLE HOOKS & COMPONENTS ──────────────────────────────
function useInViewAnim(threshold = 0.15) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px", amount: threshold });
  return [ref, inView];
}

function Section({ id, children, className = "", style = {} }) {
  return (
    <section id={id} className={className} style={{ padding: "96px 0", ...style }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>{children}</div>
    </section>
  );
}

function SectionHeader({ tag, title, sub, center = true }) {
  const [ref, inView] = useInViewAnim();
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "show" : "hidden"}
      variants={fadeUp}
      style={{ textAlign: center ? "center" : "left", maxWidth: center ? 640 : "none", margin: center ? "0 auto 52px" : "0 0 52px" }}>
      <Tag>{tag}</Tag>
      <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "clamp(34px,5vw,58px)", fontWeight: 700, lineHeight: 1.1, margin: "14px 0 16px" }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8 }}>{sub}</p>}
    </motion.div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
      color: C.bright, background: "rgba(31,163,232,0.12)", border: "1px solid rgba(31,163,232,0.25)",
      padding: "6px 14px", borderRadius: 999,
    }}>
      <motion.span animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ width: 6, height: 6, borderRadius: "50%", background: C.bright, display: "inline-block" }} />
      {children}
    </span>
  );
}

function Btn({ children, primary, small, href, onClick, style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans',sans-serif",
    fontSize: small ? 13 : 14, fontWeight: 700, padding: small ? "10px 20px" : "14px 28px",
    borderRadius: small ? 9 : 12, cursor: "pointer", border: "none", transition: "all 0.25s",
  };
  const variants = primary
    ? { background: `linear-gradient(135deg,${C.blue},${C.primary})`, color: "#fff" }
    : { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };

  return (
    <motion.button onClick={onClick || (href ? () => window.location.href = href : undefined)}
      style={{ ...base, ...variants, ...style }}
      whileHover={{ translateY: -2, boxShadow: primary ? `0 12px 40px rgba(0,123,191,0.4)` : "none" }}
      whileTap={{ scale: 0.97 }}>
      {children}
    </motion.button>
  );
}

// ── ANIMATED COUNTER ─────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(target);
    const duration = 1400;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setCount(Math.round(start));
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── PROGRESS BAR ─────────────────────────────────────────────
function ProgressBar({ pct, delay = 0 }) {
  const [ref, inView] = useInViewAnim();
  return (
    <div ref={ref} style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
      <motion.div initial={{ width: 0 }} animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: "100%", background: `linear-gradient(90deg,${C.blue},${C.bright})`, borderRadius: 4 }} />
    </div>
  );
}

// ── FAQ ITEM ─────────────────────────────────────────────────
function FaqItem({ q, a, delay = 0 }) {
  const [open, setOpen] = useState(false);
  const [ref, inView] = useInViewAnim();
  return (
    <motion.div ref={ref} variants={stagger(delay)} initial="hidden" animate={inView ? "show" : "hidden"}
      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${open ? "rgba(0,123,191,0.4)" : C.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", color: open ? C.bright : "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", gap: 12, textAlign: "left" }}>
        {q}
        <motion.div animate={{ rotate: open ? 45 : 0 }}
          style={{ width: 22, height: 22, borderRadius: "50%", background: open ? "rgba(0,123,191,0.3)" : "rgba(0,123,191,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.primary, flexShrink: 0 }}>
          +
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
            <p style={{ padding: "0 20px 16px", fontSize: 13, color: C.gray, lineHeight: 1.8 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN HOMEPAGE COMPONENT
// ════════════════════════════════════════════════════════════
export default function HomePage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // ── INLINE STYLES ────────────────────────────────────────
  const S = {
    page: { background: C.dark, color: C.white, fontFamily: "'DM Sans',sans-serif", overflowX: "hidden" },
    nav: {
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(14,12,11,0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      transition: "all 0.3s",
    },
    navInner: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, maxWidth: 1200, margin: "0 auto", padding: "0 24px" },
    gridBg: { position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,123,191,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,123,191,0.05) 1px,transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none", maskImage: "radial-gradient(ellipse at center,rgba(0,0,0,0.6) 0%,transparent 70%)" },
  };

  // ── NAV LINKS ────────────────────────────────────────────
  const navLinks = [
    { label: "Courses",   id: "courses" },
    { label: "Roadmap",   id: "roadmap" },
    { label: "Placement", id: "placement" },
    { label: "Free",      id: "free" },
    { label: "Book Demo", id: "demo" },
  ];

  // ── DATA ─────────────────────────────────────────────────
  const courses = [
    {
      title: "Plastic Product Design", duration: "4 Months", sessions: "40+", rating: "4.9",
      price: "₹18,000", badge: "🏆 Most Popular", badgeColor: "#1fa3e8",
      tags: ["CATIA V5", "Surfacing", "Mould Design", "GD&T"],
      desc: "Master CATIA V5 surfacing, mould design, and plastic part manufacturing from scratch to industry standard.",
      accent: "#024981",
    },
    {
      title: "BIW Product Design", duration: "4 Months", sessions: "35+", rating: "4.8",
      price: "₹18,000", badge: "🚀 Industry Favourite", badgeColor: "#22c55e",
      tags: ["BIW Design", "CATIA", "Automotive", "Weld Analysis"],
      desc: "Learn Body-in-White design for automotive, including structural analysis, welding, and CATIA BIW tools.",
      accent: "#075e85",
    },
    {
      title: "UG NX Product Design", duration: "3 Months", sessions: "30+", rating: "4.7",
      price: "₹15,000", badge: "⚡ New", badgeColor: "#f97316",
      tags: ["UG NX", "Sync Modelling", "Simulation", "CAM"],
      desc: "Comprehensive UG NX training for product design — synchronous modelling, simulation and manufacturing prep.",
      accent: "#003c6e",
    },
  ];

  const features = [
    { icon: "🎯", title: "Real Industry Projects", desc: "Work on actual CATIA and NX projects used in automotive and product companies — not textbook exercises." },
    { icon: "📹", title: "Live Weekly Sessions", desc: "Expert-led live classes every week. Ask questions in real time and get reviewed feedback on your assignments." },
    { icon: "🏭", title: "Industry Expert Tutors", desc: "All tutors have 5–18 years of hands-on experience at companies like TATA, Bajaj, L&T, and Mahindra." },
    { icon: "📊", title: "Smart Learning Dashboard", desc: "Track sessions, assignments, syllabus progress and queries — all in one clean, mobile-friendly portal." },
    { icon: "🏆", title: "Placement Support", desc: "Resume building, mock interviews, and direct referrals to companies hiring for CAD design roles." },
    { icon: "📜", title: "Recognised Certificate", desc: "Earn a government-recognised certification upon course completion that companies actively look for." },
  ];

  const roadmap = [
    { num: "01", title: "Foundation", desc: "Software basics, sketcher, part modelling & drawing standards", items: ["CATIA / NX Interface", "Basic Modelling", "2D Drawing GD&T"] },
    { num: "02", title: "Core Design", desc: "Advanced surfacing, sheet metal, and assembly design", items: ["CATIA Surfacing", "Sheet Metal", "Assembly Design"] },
    { num: "03", title: "Industry Projects", desc: "Real automotive and plastic product design projects", items: ["Mould Design", "BIW Components", "Tolerance Analysis"] },
    { num: "04", title: "Placement Ready", desc: "Portfolio, resume, mock interviews and job referrals", items: ["Portfolio Review", "Mock Interviews", "Job Referrals"] },
  ];

  const companies = ["ALSTOM", "TATA", "Mahindra", "L&T", "Bajaj", "Thermax", "KPIT", "Pune EV Cos", "John Deere"];

  const testimonials = [
    { name: "Divya Angane", role: "Plastic Product Design", placed: "Bajaj Auto, Pune", avatar: "D", color: `linear-gradient(135deg,${C.blue},${C.primary})`, review: "The CATIA surfacing techniques I learned here are exactly what they use at Mahindra. My tutor had 10+ years of real industry experience and it showed in every session." },
    { name: "Rahul Patil",   role: "BIW Product Design",      placed: "TATA Technologies",  avatar: "R", color: "linear-gradient(135deg,#7c3aed,#a855f7)", review: "From zero knowledge to a job offer in 5 months. The roadmap was structured, assignments were tough but that's what prepared me for real work. Best investment I made." },
    { name: "Meena Iyer",    role: "UG NX Product Design",    placed: "L&T Pune",           avatar: "M", color: "linear-gradient(135deg,#16a34a,#22c55e)", review: "The live sessions and industry project work made all the difference. I cleared my technical interview at L&T because I had actually worked on BIW components here." },
  ];

  const freeCourses = [
    { duration: "1 Hr 20 Min", title: "Plastic Product Design — Introduction", desc: "Understand the full scope of plastic product design: materials, manufacturing methods, and how CATIA is used in real factories." },
    { duration: "0 Hr 55 Min", title: "BIW Design Fundamentals",               desc: "Learn what Body-in-White means in automotive, why it matters and what tools every aspiring BIW designer must master." },
    { duration: "1 Hr 05 Min", title: "UG NX Basics for Beginners",            desc: "A guided walkthrough of UG NX interface, sketcher environment and your first 3D part — even if you've never used NX before." },
  ];

  const faqs = [
    { q: "Do I need prior CAD experience?", a: "No prior experience is needed. Our courses start from absolute basics and build up to advanced industry-level design. We've placed freshers as well as experienced engineers." },
    { q: "Are sessions live or recorded?", a: "Sessions are live, led by industry experts. All live sessions are also recorded and available in your portal immediately after — so you never miss a class." },
    { q: "What software will I need?", a: "You will need CATIA V5 or UG NX depending on your course. We provide guidance on installation, and educational licences are available at discounted rates for our students." },
    { q: "Is placement guaranteed?", a: "We provide 100% placement assistance including resume review, mock interviews, and referrals to our network of 50+ hiring partners. Our track record is 312 placed students across top companies." },
    { q: "How many hours per week do I need?", a: "Expect 1 live session per week (1–1.5 hrs) plus 4–6 hours of self-practice and assignments. The program is designed for working professionals with flexible schedules." },
  ];

  return (
    <div style={S.page}>
      {/* ── Scroll progress bar ─────────────────────────────── */}
      <motion.div style={{ position: "fixed", top: 0, left: 0, height: 2, background: `linear-gradient(90deg,${C.blue},${C.bright})`, zIndex: 200, width: progressWidth, transformOrigin: "left" }} />

      {/* ══════════════════ NAV ════════════════════════════════ */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C.blue},${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>D</div>
            DigitalCAD<span style={{ color: C.bright }}>&nbsp;Training</span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }} className="dct-hide-mobile">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.7)"}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="dct-hide-mobile">
            <Link to="/auth/login"
              style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.target.style.color = "#fff"; e.target.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.7)"; e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}>
              Login
            </Link>
            <Btn primary small onClick={() => scrollTo("demo")}>Enroll Now</Btn>
          </div>

          {/* Hamburger */}
          <button onClick={() => setMobileOpen(v => !v)} className="dct-show-mobile"
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 6 }}>
            {[0, 1, 2].map(i => (
              <motion.span key={i} animate={mobileOpen
                ? i === 0 ? { rotate: 45, translateY: 7 } : i === 1 ? { opacity: 0 } : { rotate: -45, translateY: -7 }
                : { rotate: 0, translateY: 0, opacity: 1 }}
                style={{ display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2 }} />
            ))}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ background: "rgba(14,12,11,0.97)", backdropFilter: "blur(20px)", padding: "16px 24px 24px", borderTop: `1px solid ${C.border}` }}>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)}
                  style={{ display: "block", width: "100%", padding: "14px 16px", background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", textAlign: "left", borderRadius: 10 }}>
                  {l.label}
                </button>
              ))}
              <Link to="/auth/login" onClick={() => setMobileOpen(false)}
                style={{ display: "block", padding: "14px 16px", color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
                Student Login
              </Link>
              <button onClick={() => scrollTo("demo")}
                style={{ display: "block", width: "100%", marginTop: 8, padding: "16px", background: `linear-gradient(135deg,${C.blue},${C.primary})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Enroll Now →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════ HERO ═══════════════════════════════ */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", padding: "100px 0 60px" }}>
        {/* BG layers */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 70% 50%,rgba(2,73,129,0.25) 0%,transparent 70%),radial-gradient(ellipse 50% 40% at 20% 80%,rgba(0,60,110,0.15) 0%,transparent 60%),${C.dark}` }} />
        <div style={S.gridBg} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1, width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }} className="dct-hero-grid">

            {/* Left */}
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
              <motion.div variants={fadeUp}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)`, padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 24 }}>
                  <span style={{ background: C.primary, color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 11 }}>New Batch</span>
                  Starting April 2025
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "clamp(42px,7vw,88px)", fontWeight: 700, lineHeight: 1.0, letterSpacing: -1, marginBottom: 20 }}>
                Industry-Ready<br />
                <span style={{ color: C.bright }}>Mechanical Design</span><br />
                Courses
              </motion.h1>

              <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ color: "#fbbf24", letterSpacing: 2, fontSize: 18 }}>★★★★★</span>
                <p style={{ fontSize: 13, color: C.gray }}>4.9/5 rating from <strong style={{ color: "#fff" }}>312+</strong> students placed</p>
              </motion.div>

              <motion.p variants={fadeUp} style={{ fontSize: 16, color: C.gray, maxWidth: 480, marginBottom: 28, lineHeight: 1.8 }}>
                Master CATIA, UG NX & Mould Design with real industry projects, live expert sessions, and guaranteed placement support.
              </motion.p>

              <motion.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
                <Btn primary onClick={() => scrollTo("courses")}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  Explore Courses
                </Btn>
                <Btn onClick={() => scrollTo("demo")} style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M10 8l6 4-6 4V8z"/></svg>
                  Book Free Demo
                </Btn>
              </motion.div>

              <motion.div variants={fadeUp} style={{ display: "flex", gap: 32, paddingTop: 28, borderTop: `1px solid rgba(255,255,255,0.07)`, flexWrap: "wrap" }}>
                {[
                  { val: null, counter: 312, suffix: "+", label: "Students Placed" },
                  { val: null, counter: 8,   suffix: "",  label: "Expert Tutors" },
                  { val: "4 Months",          label: "Career-Ready Program" },
                  { val: "100%",              label: "Placement Support" },
                ].map((s, i) => (
                  <div key={i}>
                    <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                      {s.counter ? <Counter target={s.counter} suffix={s.suffix} /> : s.val}
                    </p>
                    <p style={{ fontSize: 12, color: C.gray, fontWeight: 500, marginTop: 3 }}>{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — hero card */}
            <motion.div className="dct-hide-mobile-block" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative" }}>

              {/* Decorative ring */}
              <div style={{ position: "absolute", width: 300, height: 300, border: "1px solid rgba(0,123,191,0.12)", borderRadius: "50%", top: "50%", right: -60, transform: "translateY(-50%)", pointerEvents: "none" }} />

              {/* Main card */}
              <div style={{ background: "linear-gradient(135deg,rgba(2,73,129,0.6),rgba(0,60,110,0.4))", border: "1px solid rgba(0,123,191,0.3)", borderRadius: 20, padding: 28, backdropFilter: "blur(20px)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 180, height: 180, background: "radial-gradient(circle,rgba(31,163,232,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />

                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(31,163,232,0.15)", border: "1px solid rgba(31,163,232,0.3)", padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: C.bright, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: C.bright, display: "inline-block" }} />
                  Live Now
                </div>
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 6, lineHeight: 1.2 }}>Plastic Product Design<br />Masterclass</h3>
                <p style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>Session 12 · CATIA V5 Surfacing · 47 students attending</p>

                {[
                  { label: "Course Progress", val: "68%", pct: 68 },
                  { label: "Assignments Submitted", val: "8/10", pct: 80 },
                  { label: "Projects Completed", val: "2/3", pct: 66 },
                ].map((p, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.gray, marginBottom: 6 }}>
                      <span>{p.label}</span><span style={{ color: C.bright, fontWeight: 700 }}>{p.val}</span>
                    </div>
                    <ProgressBar pct={p.pct} delay={i * 0.2} />
                  </div>
                ))}

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex" }}>
                    {["D","R","M","+44"].map((a, i) => (
                      <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #1a1612", marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: i === 3 ? 9 : 12, fontWeight: 700, color: "#fff", background: i === 0 ? `linear-gradient(135deg,${C.blue},${C.primary})` : i === 1 ? "linear-gradient(135deg,#7c3aed,#a855f7)" : i === 2 ? "linear-gradient(135deg,#16a34a,#22c55e)" : "rgba(255,255,255,0.1)" }}>
                        {a}
                      </div>
                    ))}
                  </div>
                  <Btn primary small onClick={() => scrollTo("demo")}>Join Batch →</Btn>
                </div>
              </div>

              {/* Floating pills */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", top: -20, right: -20, background: "rgba(14,12,11,0.9)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 14, padding: "10px 16px", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e88" }} />
                Batch April 2025 open
              </motion.div>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", bottom: -20, left: -20, background: "rgba(14,12,11,0.9)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 14, padding: "10px 16px", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: "#fbbf24" }}>★</span> 4.9 · 312 placements
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TRUST BAR ═══════════════════════════ */}
      <div style={{ padding: "24px 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          {[
            { icon: "🛡️", text: "Govt. Recognised Certification" },
            { icon: "📹", text: "Live Weekly Sessions" },
            { icon: "👨‍💼", text: "Industry Expert Tutors" },
            { icon: "✅", text: "100% Placement Support" },
            { icon: "💻", text: "Online · Live + Recorded" },
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              style={{ display: "flex", alignItems: "center", gap: 8, color: C.gray, fontSize: 13, fontWeight: 600 }}>
              <span style={{ fontSize: 15 }}>{t.icon}</span> {t.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══════════════════ COURSES ══════════════════════════════ */}
      <Section id="courses">
        <SectionHeader tag="Our Programs" title={<>Industry-Focused <span style={{ color: C.bright }}>Engineering Courses</span></>} sub="Structured programs built around real industry projects, live expert mentorship, and job-ready skills in mechanical CAD design." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }} className="dct-3col">
          {courses.map((course, i) => {
            const [ref, inView] = [useRef(null), useInView(useRef(null), { once: true })];
            return (
              <motion.div key={i} ref={ref} variants={stagger(i * 0.12)} initial="hidden"
                animate={useInView(ref, { once: true }) ? "show" : "hidden"}
                whileHover={{ y: -5, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", transition: "border-color 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,123,191,0.4)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                {/* Card header */}
                <div style={{ height: 160, background: `linear-gradient(135deg,${course.accent},rgba(0,60,110,0.8))`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 80 80" style={{ width: 72, height: 72, opacity: 0.4 }} fill="none" stroke="rgba(31,163,232,0.8)" strokeWidth="1.5">
                    <rect x="10" y="10" width="60" height="60" rx="5"/>
                    <line x1="10" y1="40" x2="70" y2="40"/>
                    <line x1="40" y1="10" x2="40" y2="70"/>
                    <circle cx="40" cy="40" r="12"/>
                  </svg>
                  <span style={{ position: "absolute", top: 12, left: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "4px 10px", borderRadius: 999, background: "rgba(0,0,0,0.4)", color: course.badgeColor, border: `1px solid ${course.badgeColor}44` }}>
                    {course.badge}
                  </span>
                </div>
                <div style={{ padding: 22 }}>
                  <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>{course.title}</h3>
                  <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginBottom: 14 }}>{course.desc}</p>
                  <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
                    {[`⏱ ${course.duration}`, `📚 ${course.sessions} Sessions`, `★ ${course.rating}`].map((m, j) => (
                      <span key={j} style={{ fontSize: 12, color: j === 2 ? C.bright : C.lg }}>{m}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                    {course.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, color: C.gray, background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.08)`, padding: "3px 10px", borderRadius: 999 }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700 }}>{course.price}</span>
                    <Btn primary small onClick={() => scrollTo("demo")}>Enroll Now</Btn>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ══════════════════ WHY DCT ═══════════════════════════════ */}
      <Section style={{ background: C.dark2, padding: "96px 0", position: "relative" }}>
        <div style={S.gridBg} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <SectionHeader tag="Why Choose DCT" title={<>Everything You Need to <span style={{ color: C.bright }}>Go Industry-Ready</span></>} sub="We don't just teach software. We build mechanical engineers who can walk into any Tier-1 company and deliver." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="dct-3col">
            {features.map((f, i) => {
              const ref = useRef(null);
              const inView = useInView(ref, { once: true });
              return (
                <motion.div key={i} ref={ref} variants={stagger(i * 0.1)} initial="hidden" animate={inView ? "show" : "hidden"}
                  whileHover={{ y: -3 }}
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, position: "relative", overflow: "hidden", transition: "border-color 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,123,191,0.35)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(0,123,191,0.12)", border: "1px solid rgba(0,123,191,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 24 }}>
                    {f.icon}
                  </div>
                  <h4 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{f.title}</h4>
                  <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ══════════════════ DASHBOARD PREVIEW ═══════════════════ */}
      <Section style={{ background: C.dark }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="dct-2col">
          {/* Left */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeLeft}>
            <Tag>Student Portal</Tag>
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, lineHeight: 1.1, margin: "16px 0 12px" }}>
              Smartly Designed <span style={{ color: C.bright }}>Learning Dashboard</span>
            </h2>
            <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, marginBottom: 28 }}>
              Your entire course, in one place. Track progress, submit assignments, view session recordings, and raise queries — anytime from any device.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "📅", title: "Session Tracking", desc: "View all upcoming, live and completed sessions with recordings and notes" },
                { icon: "📝", title: "Assignment Submission", desc: "Submit CATIA/NX files directly, get tutor feedback in the portal" },
                { icon: "💬", title: "My Queries", desc: "Ask questions per session — your tutor answers within 24 hours" },
              ].map((dp, i) => {
                const ref = useRef(null);
                const inView = useInView(ref, { once: true });
                return (
                  <motion.div key={i} ref={ref} variants={stagger(i * 0.12)} initial="hidden" animate={inView ? "show" : "hidden"}
                    whileHover={{ x: 4, borderColor: "rgba(0,123,191,0.35)" }}
                    style={{ display: "flex", gap: 14, padding: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 14, transition: "all 0.2s" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(0,123,191,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{dp.icon}</div>
                    <div>
                      <h5 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{dp.title}</h5>
                      <p style={{ fontSize: 12, color: C.gray, lineHeight: 1.5 }}>{dp.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div style={{ marginTop: 28 }}>
              <Btn primary onClick={() => navigate("/auth/login")}>
                View Dashboard →
              </Btn>
            </div>
          </motion.div>

          {/* Right — browser mockup */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeRight}
            className="dct-hide-mobile-block">
            <div style={{ background: "#1a1612", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.6)" }}>
              <div style={{ background: "#241f1a", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}>
                {[["#ff5f57"], ["#febc2e"], ["#28c840"]].map(([c]) => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                <div style={{ flex: 1, margin: "0 12px", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "5px 12px", fontSize: 11, color: C.gray }}>digitalcadtraining.com/dct/student/courses</div>
              </div>
              <div style={{ background: "#0e0c0b", padding: 20, display: "grid", gridTemplateColumns: "150px 1fr", minHeight: 280, gap: 0 }}>
                {/* Sidebar */}
                <div style={{ background: "#1a1612", borderRadius: 12, padding: 10, marginRight: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14, padding: "6px 8px" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${C.blue},${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>D</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Dashboard</span>
                  </div>
                  {[["📚 My Courses", true], ["📅 Sessions", false], ["📝 Assignments", false], ["📖 Syllabus", false], ["💬 Queries", false]].map(([label, active]) => (
                    <div key={label} style={{ padding: "7px 9px", borderRadius: 7, fontSize: 10, color: active ? C.bright : C.gray, background: active ? "rgba(0,123,191,0.2)" : "transparent", marginBottom: 2, fontWeight: active ? 600 : 400 }}>{label}</div>
                  ))}
                </div>
                {/* Main content */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start" }}>
                  {[{ label: "Sessions Done", val: "14/40", pct: 35 }, { label: "Assignments", val: "8/10", pct: 80 }].map((c) => (
                    <div key={c.label} style={{ background: "#1a1612", border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 10, padding: 11 }}>
                      <p style={{ fontSize: 9, color: C.gray, marginBottom: 5 }}>{c.label}</p>
                      <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700 }}>{c.val}</p>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, marginTop: 5 }}>
                        <div style={{ width: `${c.pct}%`, height: "100%", background: `linear-gradient(90deg,${C.blue},${C.bright})`, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ gridColumn: "1/-1", background: "#1a1612", border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 10, padding: 11 }}>
                    <p style={{ fontSize: 9, color: C.gray, marginBottom: 7 }}>Upcoming Sessions</p>
                    {[["#22c55e","Session 15 · CATIA Surfacing · Tomorrow 8 PM"],["#007BBF","Session 16 · Draft Analysis · Fri 8 PM"],["rgba(255,255,255,0.2)","Session 17 · Mould Base · Next Week"]].map(([dot, text]) => (
                      <div key={text} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 7px", background: "rgba(255,255,255,0.03)", borderRadius: 6, marginBottom: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════ ROADMAP ══════════════════════════════ */}
      <Section id="roadmap" style={{ background: C.dark2 }}>
        <SectionHeader tag="Training Roadmap" title={<>4-Month <span style={{ color: C.bright }}>Career-Ready</span> Journey</>} sub="A structured path from absolute beginner to industry-ready mechanical design professional." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, position: "relative" }} className="dct-4col">
          <div style={{ position: "absolute", top: 44, left: "12.5%", right: "12.5%", height: 2, background: `linear-gradient(90deg,${C.blue},${C.primary},${C.bright},${C.primary})`, zIndex: 0 }} className="dct-hide-mobile" />
          {roadmap.map((step, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true });
            return (
              <motion.div key={i} ref={ref} variants={stagger(i * 0.12)} initial="hidden" animate={inView ? "show" : "hidden"}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                <motion.div whileHover={{ scale: 1.1 }}
                  style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${C.blue},${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 20, border: `3px solid ${C.dark2}`, boxShadow: `0 0 0 1px rgba(0,123,191,0.3),0 8px 24px rgba(0,123,191,0.3)` }}>
                  {step.num}
                </motion.div>
                <motion.div whileHover={{ y: -3, borderColor: "rgba(0,123,191,0.4)" }}
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, width: "100%", textAlign: "center", transition: "all 0.3s" }}>
                  <h4 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6, color: C.bright }}>{step.title}</h4>
                  <p style={{ fontSize: 12, color: C.gray, lineHeight: 1.5, marginBottom: 10 }}>{step.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {step.items.map(item => (
                      <span key={item} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                        <span style={{ color: C.primary }}>›</span>{item}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ══════════════════ PLACEMENT ════════════════════════════ */}
      <Section id="placement" style={{ position: "relative" }}>
        <div style={S.gridBg} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="dct-2col">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeLeft}>
            <Tag>Placement Record</Tag>
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, lineHeight: 1.1, margin: "16px 0 12px" }}>
              Proud <span style={{ color: C.bright }}>Placement Record</span><br/>Across Top Companies
            </h2>
            <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, marginBottom: 28 }}>
              Our students land roles at India's biggest engineering, automotive and manufacturing companies — immediately after course completion.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {companies.map((c, i) => {
                const ref = useRef(null);
                const inView = useInView(ref, { once: true });
                return (
                  <motion.div key={c} ref={ref} variants={stagger(i * 0.06)} initial="hidden" animate={inView ? "show" : "hidden"}
                    whileHover={{ borderColor: "rgba(0,123,191,0.4)", background: "rgba(0,123,191,0.08)" }}
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", textAlign: "center", fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", transition: "all 0.2s", letterSpacing: 0.5 }}>
                    {c}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeRight}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { counter: 312, suffix: "+", label: "Students Placed" },
                { counter: 50,  suffix: "+", label: "Hiring Partners" },
                { val: "4.9★",              label: "Average Rating" },
                { val: "100%",              label: "Placement Support" },
              ].map((s, i) => {
                const ref = useRef(null);
                const inView = useInView(ref, { once: true });
                return (
                  <motion.div key={i} ref={ref} variants={stagger(i * 0.1)} initial="hidden" animate={inView ? "show" : "hidden"}
                    whileHover={{ borderColor: "rgba(0,123,191,0.35)", y: -2 }}
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, textAlign: "center", transition: "all 0.2s" }}>
                    <p style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 42, fontWeight: 700, background: `linear-gradient(135deg,${C.primary},${C.bright})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>
                      {s.counter ? <Counter target={s.counter} suffix={s.suffix} /> : s.val}
                    </p>
                    <p style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{s.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════ TESTIMONIALS ═════════════════════════ */}
      <Section style={{ background: C.dark2 }}>
        <SectionHeader tag="Student Stories" title={<>Real Students, <span style={{ color: C.bright }}>Real Placements</span></>} sub="Don't take our word for it — hear from engineers who changed their careers with DigitalCAD Training." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="dct-3col">
          {testimonials.map((t, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true });
            return (
              <motion.div key={i} ref={ref} variants={stagger(i * 0.12)} initial="hidden" animate={inView ? "show" : "hidden"}
                whileHover={{ y: -4, borderColor: "rgba(0,123,191,0.3)" }}
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, position: "relative", overflow: "hidden", transition: "all 0.3s" }}>
                <div style={{ position: "absolute", top: -8, right: 16, fontSize: 100, color: "rgba(0,123,191,0.08)", fontFamily: "'Rajdhani',sans-serif", lineHeight: 1, pointerEvents: "none" }}>"</div>
                <div style={{ color: "#fbbf24", letterSpacing: 1, fontSize: 13, marginBottom: 12 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 20 }}>{t.review}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: C.gray }}>{t.role}</p>
                    <p style={{ fontSize: 11, color: C.bright, fontWeight: 600, marginTop: 2 }}>→ Placed at {t.placed}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ══════════════════ FREE COURSES ══════════════════════════ */}
      <Section id="free">
        <SectionHeader tag="Free Resources" title={<>Explore Our <span style={{ color: C.bright }}>Free Sessions</span></>} sub="Get started with mechanical design for free. Watch expert-led sessions before committing to the full program." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="dct-3col">
          {freeCourses.map((fc, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true });
            return (
              <motion.div key={i} ref={ref} variants={stagger(i * 0.12)} initial="hidden" animate={inView ? "show" : "hidden"}
                whileHover={{ y: -4, borderColor: "rgba(0,123,191,0.4)" }}
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 10, transition: "all 0.3s" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: C.bright, fontWeight: 700, background: "rgba(31,163,232,0.1)", padding: "4px 10px", borderRadius: 999 }}>⏱ {fc.duration} · FREE</span>
                <h4 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 600 }}>{fc.title}</h4>
                <p style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, flex: 1 }}>{fc.desc}</p>
                <motion.div whileHover={{ x: 4 }} style={{ display: "flex", alignItems: "center", gap: 6, color: C.bright, fontSize: 13, fontWeight: 700, paddingTop: 10, borderTop: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" opacity=".2"/><path d="M10 8l6 4-6 4V8z"/></svg>
                  Watch Free Session →
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ══════════════════ FAQ + DEMO ═══════════════════════════ */}
      <Section id="demo" style={{ background: C.dark2, position: "relative" }}>
        <div style={S.gridBg} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }} className="dct-2col">
          {/* FAQ */}
          <div>
            <Tag>FAQ</Tag>
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "clamp(30px,4vw,46px)", fontWeight: 700, lineHeight: 1.1, margin: "14px 0 8px" }}>
              Still Not <span style={{ color: C.bright }}>Convinced?</span>
            </h2>
            <p style={{ fontSize: 14, color: C.gray, marginBottom: 24, lineHeight: 1.7 }}>Everything you need to know before joining.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} delay={i * 0.07} />)}
            </div>
          </div>

          {/* Demo form */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeRight}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Book a Free Demo Today</h3>
              <p style={{ fontSize: 13, color: C.gray, marginBottom: 24, lineHeight: 1.7 }}>Talk to an expert, ask questions, and see if this course is right for you — completely free.</p>

              {[
                { label: "Full Name", type: "text", placeholder: "Rahul Sharma" },
                { label: "Phone Number", type: "tel", placeholder: "+91 98765 43210" },
                { label: "Email Address", type: "email", placeholder: "rahul@gmail.com" },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 6, letterSpacing: "0.6px", textTransform: "uppercase" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
                </div>
              ))}
              {[
                { label: "Interested In", options: ["Select a course", "Plastic Product Design", "BIW Product Design", "UG NX Product Design", "Not sure yet"] },
                { label: "Current Status", options: ["Select your status", "Final Year Student", "Fresh Graduate", "Working Professional", "Looking for Job Change"] },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 6, letterSpacing: "0.6px", textTransform: "uppercase" }}>{f.label}</label>
                  <select style={{ width: "100%", background: "#1a1612", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}>
                    {f.options.map(o => <option key={o} style={{ background: "#1a1612" }}>{o}</option>)}
                  </select>
                </div>
              ))}

              <motion.button
                onClick={() => { setDemoSubmitted(true); setTimeout(() => setDemoSubmitted(false), 4000); }}
                whileHover={!demoSubmitted ? { translateY: -2, boxShadow: "0 12px 36px rgba(0,123,191,0.4)" } : {}}
                whileTap={{ scale: 0.98 }}
                style={{ width: "100%", background: demoSubmitted ? "linear-gradient(135deg,#16a34a,#22c55e)" : `linear-gradient(135deg,${C.blue},${C.primary})`, color: "#fff", fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginTop: 8, transition: "background 0.3s" }}>
                {demoSubmitted ? "✓ Demo Booked! We'll call you soon." : "Book My Free Demo Session →"}
              </motion.button>
              <p style={{ fontSize: 11, color: C.lg, textAlign: "center", marginTop: 12 }}>
                📞 Or call us: <a href="tel:+919876543210" style={{ color: C.bright }}>+91 98765 43210</a>
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════ CTA BANNER ═══════════════════════════ */}
      <section style={{ background: "linear-gradient(135deg,#012d4a 0%,#024981 40%,#013a5c 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`, backgroundSize: "40px 40px" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={fadeUp}><Tag>Limited Seats</Tag></motion.div>
            <motion.h2 variants={fadeUp} style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "clamp(36px,6vw,64px)", fontWeight: 700, lineHeight: 1.05, margin: "16px 0" }}>
              Become <span style={{ color: C.bright }}>Industry Ready</span><br/>With Us
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
              April 2025 batch filling fast. Join 312+ students who transformed their mechanical engineering careers.
            </motion.p>
            <motion.div variants={fadeUp} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <Btn primary style={{ padding: "16px 36px", fontSize: 15 }} onClick={() => scrollTo("demo")}>🚀 Enroll in April Batch</Btn>
              <Btn style={{ padding: "15px 36px", fontSize: 15, border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => scrollTo("free")}>Watch Free Session First</Btn>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ═══════════════════════════════ */}
      <footer style={{ background: "#080706", padding: "64px 0 32px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }} className="dct-footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${C.blue},${C.primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900 }}>D</div>
                DigitalCAD<span style={{ color: C.bright }}> Training</span>
              </div>
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>India's leading mechanical CAD design training platform. Real projects, expert tutors, and 100% placement support.</p>
              <div style={{ display: "flex", gap: 10 }}>
                {["▶","in","W","📷"].map((s, i) => (
                  <motion.a key={i} href="#" whileHover={{ borderColor: "rgba(0,123,191,0.4)", color: C.bright }}
                    style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.gray, transition: "all 0.2s" }}>
                    {s}
                  </motion.a>
                ))}
              </div>
            </div>
            {/* Links */}
            {[
              { title: "Courses", links: [["Plastic Product Design","#courses"],["BIW Product Design","#courses"],["UG NX Design","#courses"],["Free Courses","#free"]] },
              { title: "Company", links: [["About Us","#"],["Our Tutors","#"],["Placement Record","#placement"],["Contact Us","#demo"],["Student Login","/auth/login"]] },
              { title: "Contact", links: [["📞 +91 98765 43210","tel:+919876543210"],["✉ info@digitalcadtraining.com","mailto:info@dct.com"],["📍 Nashik, Maharashtra","#"]] },
            ].map(col => (
              <div key={col.title}>
                <h5 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 16, color: "rgba(255,255,255,0.9)" }}>{col.title}</h5>
                {col.links.map(([label, href]) => (
                  <a key={label} href={href} style={{ display: "block", fontSize: 13, color: C.gray, padding: "4px 0", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => e.target.style.color = C.bright}
                    onMouseLeave={e => e.target.style.color = C.gray}>
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 28, borderTop: `1px solid ${C.border}`, flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: C.lg }}>© 2025 DigitalCAD Training. All rights reserved.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {[["Privacy Policy","#"],["Terms & Conditions","#"]].map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: 13, color: C.lg, textDecoration: "none" }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Responsive CSS ───────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        .dct-hero-grid { grid-template-columns: 1fr 1fr !important; }
        .dct-2col { grid-template-columns: 1fr 1fr !important; }
        .dct-3col { grid-template-columns: repeat(3,1fr) !important; }
        .dct-4col { grid-template-columns: repeat(4,1fr) !important; }
        .dct-hide-mobile { display: flex !important; }
        .dct-show-mobile { display: none !important; }
        .dct-hide-mobile-block { display: block !important; }
        .dct-footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr !important; }
        @media (max-width: 1024px) {
          .dct-4col { grid-template-columns: repeat(2,1fr) !important; }
          .dct-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 768px) {
          .dct-hero-grid { grid-template-columns: 1fr !important; }
          .dct-2col { grid-template-columns: 1fr !important; }
          .dct-3col { grid-template-columns: 1fr !important; }
          .dct-4col { grid-template-columns: 1fr 1fr !important; }
          .dct-hide-mobile { display: none !important; }
          .dct-show-mobile { display: flex !important; }
          .dct-hide-mobile-block { display: none !important; }
          .dct-footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .dct-4col { grid-template-columns: 1fr !important; }
        }
        input::placeholder, select { color: #6b7280 !important; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
