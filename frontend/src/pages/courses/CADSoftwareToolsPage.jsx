import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BATCH_START_DATE = "11 July 2026";
const COURSE_SLUG = "cad-software-tools";

const DELIVERY_MODES = [
  { id: "online", label: "Online Live" },
  { id: "offline-pune-nigdi", label: "Offline - Pune Nigdi" },
  { id: "hybrid", label: "Hybrid" },
];

const SOFTWARE_TOOLS = [
  {
    id: "catia-v5",
    slug: "catia-basic",
    name: "CATIA V5",
    title: "CATIA V5 Basic Software Training",
    heroTitle: "Learn CATIA V5 Software From Basics",
    focusLine: "Build strong CATIA software command for sketching, modeling, assembly and drafting.",
    timing: "11:00 AM - 12:00 PM",
    syllabusUrl: "/downloads/catia-v5-basic-syllabus.pdf",
    accent: "catia",
    description: "This is a pure CATIA V5 software training course for beginners and freshers. Learn the interface, Sketcher, Part Design, Assembly and Drafting workflow step by step with practice tasks.",
    heroBullets: ["CATIA interface and file workflow", "Sketcher constraints and dimensions", "Part Design commands with practice", "Assembly basics and product structure", "Drafting views and dimensions", "Practice-day assignments after live sessions"],
    sections: [
      { title: "CATIA software foundation", copy: "Students first understand the CATIA environment, workbenches, tree structure and file discipline. The focus is to make the software easy and comfortable from day one.", points: ["Workbench navigation", "Tree structure", "File handling", "Command workflow"] },
      { title: "Sketcher and Part Design workflow", copy: "After the interface, students learn sketch creation, constraints, dimensions and then move into solid feature creation using pad, pocket, shaft, groove, fillet, chamfer and shell.", points: ["Sketcher practice", "Solid features", "Feature editing", "Model correction"] },
      { title: "Assembly and drafting basics", copy: "The course closes with assembly basics, drafting views and drawing interpretation so students can handle basic CATIA software tasks confidently.", points: ["Assembly constraints", "Drawing views", "Dimension reading", "Basic documentation"] },
    ],
  },
  {
    id: "ug-nx",
    slug: "nx-basic",
    name: "UG NX",
    title: "UG NX Basic Software Training",
    heroTitle: "Learn UG NX Software From Basics",
    focusLine: "Build UG NX software command for sketching, modeling, synchronous edits, assembly and drafting.",
    timing: "12:00 PM - 1:00 PM",
    syllabusUrl: "/downloads/ug-nx-basic-syllabus.pdf",
    accent: "nx",
    description: "This is a pure UG NX software training course for beginners and freshers. Learn NX interface, sketching, modeling, synchronous edits, assembly and drafting workflow with practice tasks.",
    heroBullets: ["NX interface and part navigator", "NX sketching with constraints", "Core solid modeling commands", "Synchronous modeling introduction", "Assembly and drafting basics", "Practice-day assignments after live sessions"],
    sections: [
      { title: "NX software foundation", copy: "Students first understand the NX environment, part navigator, file handling, sketches and feature tree to become comfortable with NX software workflow.", points: ["Part navigator", "Sketch workflow", "Expressions", "Feature tree"] },
      { title: "Practical modeling commands", copy: "The course covers core NX solid modeling commands with practice models so students can create and modify basic parts confidently.", points: ["Extrude", "Revolve", "Hole and shell", "Edge blend"] },
      { title: "Synchronous edits and drafting", copy: "Students learn basic direct edits, assembly positioning and drafting views to understand the complete NX software workflow.", points: ["Direct edit basics", "Assembly positioning", "Drawing views", "Workflow practice"] },
    ],
  },
  {
    id: "solidworks",
    slug: "solidworks-basic",
    name: "SolidWorks",
    title: "SolidWorks Basic Software Training",
    heroTitle: "Learn SolidWorks Software From Basics",
    focusLine: "Build SolidWorks software command for sketching, parametric modeling, assembly and drawings.",
    timing: "1:00 PM - 2:00 PM",
    syllabusUrl: "/downloads/solidworks-basic-syllabus.pdf",
    accent: "solidworks",
    description: "This is a pure SolidWorks software training course for beginners and freshers. Learn sketching, parametric part modeling, assemblies and drawing creation with practice tasks.",
    heroBullets: ["SolidWorks interface and design tree", "Fully defined sketches and relations", "Part modeling commands with practice", "Assembly mates and product structure", "2D drawing and dimension basics", "Practice-day assignments after live sessions"],
    sections: [
      { title: "SolidWorks software foundation", copy: "Students learn how sketches, relations, dimensions and design tree history control a model. The focus is to build clear SolidWorks software understanding.", points: ["Design tree", "Sketch relations", "Dimensions", "Parametric logic"] },
      { title: "Part modeling and feature control", copy: "The training covers extrude, cut, revolve, fillet, chamfer, shell, mirror and pattern with practical model creation.", points: ["Extrude and cut", "Revolve", "Fillet and chamfer", "Pattern and mirror"] },
      { title: "Assembly and drawing workflow", copy: "Students learn simple assemblies, mates and drawing views so they can understand the complete part-to-drawing workflow in SolidWorks.", points: ["Assembly mates", "Drawing sheets", "View creation", "Basic documentation"] },
    ],
  },
];

const PRICING = {
  1: { amount: 10000, label: "Any 1 Software Course" },
  2: { amount: 14000, label: "Any 2 Software Courses" },
  3: { amount: 15000, label: "All 3 Software Courses" },
};

const CSS = `.software-course-page{background:#f8fcff;color:#1f1a17;font-family:"DM Sans",system-ui,sans-serif;padding-bottom:90px}.software-wrap{width:min(1180px,calc(100% - 36px));margin:0 auto}.software-hero{padding:72px 0 64px;color:#fff;background:linear-gradient(135deg,#05133a,#024981 58%,#037ec4)}.software-hero.nx{background:linear-gradient(135deg,#152d38,#24566d 55%,#1688b8)}.software-hero.solidworks{background:linear-gradient(135deg,#142433,#024981 55%,#0d92db)}.software-hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) 390px;gap:42px;align-items:center}.software-eyebrow,.section-head span,.small-label{display:inline-flex;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);color:#7be3ff;font-size:12px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.software-hero h1{margin:20px 0 18px;font-size:clamp(42px,6vw,82px);line-height:.98;letter-spacing:-.065em;font-weight:950}.software-hero p{max-width:770px;margin:0;color:rgba(255,255,255,.9);font-size:18px;line-height:1.72;font-weight:700}.software-hero-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}.software-hero-meta div{padding:16px;border-radius:18px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.software-hero-meta span{display:block;color:rgba(255,255,255,.68);font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:900}.software-hero-meta strong{display:block;margin-top:4px;font-size:17px;font-weight:950}.software-hero-meta small{display:block;color:rgba(255,255,255,.72);font-weight:800}.software-hero-actions,.section-cta-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:24px}.software-hero-actions button,.section-cta-row button,.software-price-card button,.software-final-cta button,.software-sticky-cta button{min-height:54px;padding:0 28px;border:0;border-radius:16px;background:linear-gradient(135deg,#ff9f1c,#ffca3a);color:#1f1a17;font-size:16px;font-weight:950;cursor:pointer;box-shadow:0 16px 36px rgba(255,159,28,.24)}.software-hero-actions .secondary,.section-cta-row .outline{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);color:#fff}.section-cta-row .outline{background:#e5f2f9;color:#024981;border:1px solid #d8e7f1}.software-price-card{padding:28px;border-radius:28px;background:#fff;color:#1f1a17;border:1px solid #d8e7f1;box-shadow:0 24px 70px rgba(0,0,0,.18)}.software-price-card span{display:inline-flex;padding:8px 11px;border-radius:999px;background:#dbf7e5;color:#047a35;font-size:12px;font-weight:950}.software-price-card strong{display:block;margin:18px 0 8px;font-size:46px;font-weight:950;letter-spacing:-.06em}.software-price-card p{color:#4b5666;font-size:15px;line-height:1.65}.software-price-card button{width:100%;margin-top:12px;background:linear-gradient(135deg,#024981,#037ec4);color:#fff}.software-section{padding:74px 0}.software-section.soft{background:#e5f2f9}.section-head{text-align:center;max-width:830px;margin:0 auto 30px}.section-head.left{text-align:left;margin:0 0 28px}.section-head span,.small-label{background:#e5f2f9;color:#024981;border-color:#d8e7f1}.section-head h2,.software-detail-grid h2,.placements-box h2,.software-final-cta h2{margin:14px 0 14px;font-size:clamp(30px,4.2vw,56px);line-height:1.06;font-weight:950;letter-spacing:-.055em}.section-head p,.software-detail-grid p,.placements-box p{color:#4b5666;font-size:16px;line-height:1.75;font-weight:650}.software-points-grid,.trust-six-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.software-points-grid div,.trust-six-grid div,.placement-points div{padding:18px;border-radius:20px;background:#fff;border:1px solid #d8e7f1;color:#1f1a17;font-weight:850;box-shadow:0 12px 34px rgba(2,73,129,.06)}.software-detail-grid,.placements-box{display:grid;grid-template-columns:1fr .8fr;gap:28px;align-items:center}.software-check-card{display:grid;gap:12px}.software-check-card div{padding:16px;border-radius:18px;background:#fff;border:1px solid #d8e7f1;font-weight:850}.learning-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.learning-flow div{padding:22px;border-radius:24px;background:#fff;border:1px solid #d8e7f1;text-align:center;box-shadow:0 12px 34px rgba(2,73,129,.06)}.learning-flow strong{display:block;color:#024981;font-size:24px;font-weight:950}.learning-flow span{display:block;margin-top:8px;color:#4b5666;font-weight:750}.center{justify-content:center}.software-select-box{padding:44px;border-radius:32px;background:linear-gradient(180deg,#fff,#f5fbff);border:1px solid #d8e7f1;box-shadow:0 24px 70px rgba(2,73,129,.1)}.software-select-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.software-select-card{padding:20px;border-radius:24px;background:#fff;border:1px solid #d8e7f1;box-shadow:0 12px 34px rgba(2,73,129,.06);transition:.22s}.software-select-card.active{border-color:#ff9f1c;box-shadow:0 18px 44px rgba(255,159,28,.2);transform:translateY(-3px)}.software-select-card strong{display:inline-flex;margin-bottom:10px;padding:8px 11px;border-radius:12px;background:#024981;color:#fff;font-size:13px;font-weight:950}.software-select-card h3{margin:0 0 8px;font-size:22px;font-weight:950}.software-select-card p{color:#4b5666;line-height:1.6;font-weight:650}.software-select-card small{display:block;color:#024981;font-weight:900;margin-bottom:12px}.download-btn,.select-tool-btn{width:100%;min-height:44px;border:0;border-radius:14px;font-size:14px;font-weight:950;cursor:pointer;margin-top:8px}.download-btn{background:#e5f2f9;color:#024981}.select-tool-btn{background:linear-gradient(135deg,#ff9f1c,#ffca3a);color:#1f1a17;box-shadow:0 14px 30px rgba(255,159,28,.25);animation:toolPulse 1.8s infinite}.select-tool-btn.selected{background:linear-gradient(135deg,#024981,#037ec4);color:#fff;animation:none}@keyframes toolPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}.software-mode-box,.software-price-bar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:18px;padding:18px;border-radius:22px;background:#f8fcff;border:1px solid #d8e7f1}.software-price-bar{background:linear-gradient(135deg,#05133a,#024981);color:#fff}.software-mode-box select{min-width:240px;height:48px;border-radius:14px;border:1px solid #d8e7f1;padding:0 14px;font-weight:900}.software-price-bar strong{display:block;font-size:36px}.software-price-bar button{background:linear-gradient(135deg,#ff9f1c,#ffca3a);color:#1f1a17}.placement-points{display:grid;gap:12px}.software-final-cta{padding:66px 0;text-align:center;color:#fff;background:linear-gradient(135deg,#05133a,#024981)}.software-sticky-cta{position:fixed;left:18px;right:18px;bottom:16px;z-index:999;display:flex;align-items:center;justify-content:space-between;gap:14px;max-width:780px;margin:0 auto;padding:12px 14px;border-radius:22px;background:rgba(255,255,255,.96);border:1px solid #d8e7f1;box-shadow:0 20px 60px rgba(0,0,0,.2);backdrop-filter:blur(16px)}.software-sticky-cta span{display:block;color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase}.software-sticky-cta strong{display:block;color:#1f1a17;font-size:22px;font-weight:950}.software-sticky-cta button{min-height:46px}@media(max-width:980px){.software-hero-grid,.software-detail-grid,.placements-box{grid-template-columns:1fr}.software-hero-meta,.software-points-grid,.trust-six-grid,.learning-flow,.software-select-grid{grid-template-columns:1fr 1fr}.software-price-card{max-width:520px}}@media(max-width:640px){.software-hero{padding:50px 0}.software-hero-meta,.software-points-grid,.trust-six-grid,.learning-flow,.software-select-grid{grid-template-columns:1fr}.software-mode-box,.software-price-bar{flex-direction:column;align-items:stretch}.software-mode-box select,.software-price-bar button{width:100%;min-width:0}.software-sticky-cta{left:12px;right:12px}.software-sticky-cta button{width:55%;padding:0 14px}.software-sticky-cta strong{font-size:18px}}`;

function pricingFor(selectedTools) {
  const count = Math.max(1, Math.min(3, selectedTools.length || 1));
  return PRICING[count];
}

function getCourse(slug) {
  return SOFTWARE_TOOLS.find((course) => course.slug === slug) || SOFTWARE_TOOLS[0];
}

export default function CADSoftwareToolsPage({ slug = "catia-basic" }) {
  const navigate = useNavigate();
  const primary = getCourse(slug);
  const [selectedTools, setSelectedTools] = useState([primary.id]);
  const [mode, setMode] = useState("online");
  const pricing = useMemo(() => pricingFor(selectedTools), [selectedTools]);

  const toggleTool = (toolId) => {
    setSelectedTools((current) => {
      if (current.includes(toolId)) return current.length === 1 ? current : current.filter((id) => id !== toolId);
      return [...current, toolId];
    });
  };

  const registerNow = () => {
    const params = new URLSearchParams({ course: COURSE_SLUG, tools: selectedTools.join(","), mode, batchStart: BATCH_START_DATE, primary: primary.id });
    navigate(`/auth/register?${params.toString()}`);
  };

  const downloadSyllabus = (course = primary) => window.open(course.syllabusUrl, "_blank", "noopener,noreferrer");

  return (
    <main className="software-course-page">
      <style>{CSS}</style>

      <section className={`software-hero ${primary.accent}`}>
        <div className="software-wrap software-hero-grid">
          <div>
            <div className="software-eyebrow">Software Tools Training</div>
            <h1>{primary.heroTitle}</h1>
            <p>{primary.description}</p>
            <div className="software-hero-meta"><div><span>Batch Start</span><strong>{BATCH_START_DATE}</strong></div><div><span>Timing</span><strong>{primary.timing}</strong></div><div><span>Tutor</span><strong>Balkrishna Dhuri</strong><small>13+ Years Industry Expert</small></div></div>
            <div className="software-hero-actions"><button type="button" onClick={registerNow}>Register Now</button><button type="button" className="secondary" onClick={() => downloadSyllabus(primary)}>Download Syllabus</button></div>
          </div>
          <aside className="software-price-card"><span>{pricing.label}</span><strong>₹{pricing.amount.toLocaleString("en-IN")}</strong><p>Live software training with alternate practice days and dashboard access after registration.</p><button type="button" onClick={registerNow}>Register Now</button></aside>
        </div>
      </section>

      <section className="software-section">
        <div className="software-wrap software-focus">
          <div className="section-head left"><span>{primary.name}</span><h2>First, understand {primary.name} software clearly</h2><p>{primary.focusLine}</p></div>
          <div className="software-points-grid">{primary.heroBullets.map((point) => <div key={point}>✓ {point}</div>)}</div>
          <div className="section-cta-row"><button type="button" onClick={registerNow}>Register Now</button><button type="button" className="outline" onClick={() => downloadSyllabus(primary)}>Download PDF</button></div>
        </div>
      </section>

      {primary.sections.map((section, index) => (
        <section className={`software-section ${index % 2 ? "soft" : ""}`} key={section.title}>
          <div className="software-wrap software-detail-grid">
            <div><span className="small-label">Section {index + 1}</span><h2>{section.title}</h2><p>{section.copy}</p><button type="button" onClick={registerNow}>Register Now</button></div>
            <div className="software-check-card">{section.points.map((point) => <div key={point}>✓ {point}</div>)}</div>
          </div>
        </section>
      ))}

      <section className="software-section soft"><div className="software-wrap"><div className="section-head"><span>Session Clarity</span><h2>Live day + practice day learning system</h2><p>Every live software session is followed by a practice day where students complete assigned CAD tasks.</p></div><div className="learning-flow"><div><strong>Day 1</strong><span>Live software concept session</span></div><div><strong>Day 2</strong><span>Practice assignment and model work</span></div><div><strong>Review</strong><span>Doubt support and correction direction</span></div><div><strong>Repeat</strong><span>Next concept with stronger confidence</span></div></div><div className="section-cta-row center"><button type="button" onClick={registerNow}>Register Now</button></div></div></section>

      <section className="software-section"><div className="software-wrap"><div className="section-head"><span>Industry-Level Learning</span><h2>Why this software training builds trust</h2></div><div className="trust-six-grid"><div>✓ Software workflow clarity</div><div>✓ Practice models after live sessions</div><div>✓ Trainer with 13+ years industry experience</div><div>✓ Batch-wise structured learning</div><div>✓ Interview-focused software explanation</div><div>✓ Strong CAD foundation for freshers</div></div><div className="section-cta-row center"><button type="button" onClick={registerNow}>Register Now</button></div></div></section>

      <section className="software-section soft"><div className="software-wrap software-select-box" id="software-selection"><div className="section-head"><span>Select Software Courses</span><h2>Choose your software training package</h2><p>Start with the current software or add more tools for stronger CAD confidence.</p></div><div className="software-select-grid">{SOFTWARE_TOOLS.map((tool) => { const active = selectedTools.includes(tool.id); return <article className={`software-select-card ${active ? "active" : ""}`} key={tool.id}><strong>{tool.name}</strong><h3>{tool.title}</h3><p>{tool.focusLine}</p><small>Timing: {tool.timing}</small><button className="download-btn" type="button" onClick={() => downloadSyllabus(tool)}>Download PDF</button><button className={`select-tool-btn ${active ? "selected" : ""}`} type="button" onClick={() => toggleTool(tool.id)}>🛒 {active ? "Selected" : "Select Course"}</button></article>; })}</div><div className="software-mode-box"><div><span>Training Mode</span><strong>Choose how you want to attend</strong></div><select value={mode} onChange={(e) => setMode(e.target.value)}>{DELIVERY_MODES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div className="software-price-bar"><div><span>{pricing.label}</span><strong>₹{pricing.amount.toLocaleString("en-IN")}</strong><small>Batch starts: {BATCH_START_DATE}</small></div><button type="button" onClick={registerNow}>Register Now</button></div></div></section>

      <section className="software-section"><div className="software-wrap placements-box"><div><span className="small-label">Placement Assistance</span><h2>Unlimited interview support across PAN India</h2><p>Students get placement assistance through genuine openings, MNC/OEM/Tier-1 supplier direction, referral support and interview preparation.</p></div><div className="placement-points"><div>✓ PAN India job opening sharing</div><div>✓ Unlimited interview support</div><div>✓ Resume and profile guidance</div><div>✓ MNC/OEM/Tier-1 supplier direction</div></div></div></section>

      <section className="software-final-cta"><div className="software-wrap"><h2>Start {primary.name} with the upcoming batch</h2><p>Batch starts {BATCH_START_DATE}. Selected mode: {DELIVERY_MODES.find((item) => item.id === mode)?.label}</p><button type="button" onClick={registerNow}>Register Now</button></div></section>
      <div className="software-sticky-cta"><div><span>{pricing.label}</span><strong>₹{pricing.amount.toLocaleString("en-IN")}</strong></div><button type="button" onClick={registerNow}>Register Now</button></div>
    </main>
  );
}
