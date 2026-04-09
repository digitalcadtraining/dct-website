import CoursePage from "./CoursePage.jsx";

const COURSE = {
  slug: "ug-nx-product-design",
  name: "UG NX Product Design",
  tagline: "Industry-Ready Siemens NX Training in 3 Months",
  badge: "⚡ New Batch Open",
  badgeBg: "#FF6B2B",
  badgeColor: "#fff",
  price: 15000,
  slashPrice: 20000,
  rating: "4.7",
  reviews: "87",
  enrolled: "87+",
  duration: "3 Months",
  sessions: "30+",
  projects: "7",
  tools: ["Siemens NX", "Sync. Modelling", "Assembly", "Drafting", "CAM Basics"],
  tutor: { name: "Rahul Sharma", exp: "9 Years Experience", companies: "Ex-John Deere & KPIT", initial: "R" },
  outcomes: [
    "Master Siemens NX interface and all core modelling tools",
    "Apply synchronous modelling for rapid design changes",
    "Create complex assemblies and manage large product structures",
    "Generate manufacturing-ready technical drawings in NX",
    "Build 7 real industry product design projects",
    "Get placed at companies actively hiring NX designers",
  ],
  includes: [
    { icon: "📹", label: "30+ Live Sessions", sub: "Recordings within 2 hours" },
    { icon: "🏭", label: "7 Industry Projects", sub: "Real product design parts" },
    { icon: "📜", label: "Govt. Certificate", sub: "Recognised by recruiters" },
    { icon: "💼", label: "Placement Support", sub: "Direct company referrals" },
    { icon: "❓", label: "Doubt Support", sub: "24-hour tutor response" },
    { icon: "♾", label: "Lifetime Access", sub: "All recordings forever" },
  ],
  syllabus: [
    {
      phase: "Phase 1 — NX Fundamentals (Days 1–30)", sessions: "Sessions 1–10",
      topics: ["Siemens NX interface & customisation","Sketch & constraint-based modelling","Extrude, revolve, sweep & complex features","Synchronous modelling techniques","Assembly constraints & motion simulation"],
    },
    {
      phase: "Phase 2 — Advanced Modelling (Days 31–60)", sessions: "Sessions 11–22",
      topics: ["Surface modelling & sheet body tools","Free form feature design","Large assembly management strategies","Product manufacturing information (PMI)","Technical drawing & GD&T in NX"],
    },
    {
      phase: "Phase 3 — Industry Projects (Days 61–90)", sessions: "Sessions 23–30",
      topics: ["Project 1: Engine bracket complete assembly","Project 2: Agricultural equipment housing","Project 3: Industrial pump casing","4 Practice projects with expert review","Portfolio preparation and interview coaching"],
    },
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
    { q: "Is NX better than CATIA?", a: "Both are industry-standard tools. NX is heavily used in manufacturing, heavy engineering, and agricultural equipment. Many companies in Pune, Bangalore and Chennai hire NX designers." },
    { q: "Do I need prior CAD experience?", a: "Basic mechanical understanding helps but is not mandatory. Prior CATIA or SolidWorks experience will help you progress faster." },
    { q: "What hardware do I need?", a: "Laptop with 8GB RAM (16GB recommended), Intel i5/i7, dedicated graphics card. We share installation support and student licence guidance." },
    { q: "Are sessions recorded?", a: "Yes, all sessions are recorded within 2 hours. Lifetime access included." },
    { q: "Which companies hire NX designers?", a: "John Deere, KPIT, Mahindra, Tata Technologies, L&T, Bajaj Auto, and several Tier-1 auto suppliers actively hire Siemens NX designers." },
    { q: "How is this different from YouTube tutorials?", a: "Real industry projects, personalised feedback, doubt clearing, placement referrals, and a government certificate. YouTube gives none of those." },
  ],
  placements: ["John Deere","KPIT","Mahindra","L&T","Bajaj Auto","TATA Technologies","Wipro","SEGULA"],
};

export default function UGNXProductDesignPage() {
  return <CoursePage course={COURSE} />;
}
