import CoursePage from "./CoursePage.jsx";

const COURSE = {
  slug: "biw-product-design",
  name: "BIW Product Design",
  tagline: "Master Automotive Body-in-White Design",
  badge: "🚀 Industry Favourite",
  badgeBg: "#037EC4",
  badgeColor: "#fff",
  price: 18000,
  slashPrice: 22000,
  rating: "4.8",
  reviews: "198",
  enrolled: "198+",
  duration: "4 Months",
  sessions: "35+",
  projects: "8",
  tools: ["CATIA V5 BIW", "Assembly Design", "Weld Analysis", "GD&T", "DMU Kinematics"],
  tutor: { name: "Priya Joshi", exp: "10 Years Experience", companies: "Ex-TATA Motors & Mahindra", initial: "P" },
  outcomes: [
    "Design BIW components used in real automotive production",
    "Apply welding standards, joint design and structural principles",
    "Work with CATIA BIW workbench tools professionally",
    "Understand automotive design for manufacturability (DFM)",
    "Build a portfolio of 8 real BIW industry projects",
    "Get placed at Tier-1 automotive companies across India",
  ],
  includes: [
    { icon: "📹", label: "35+ Live Sessions", sub: "Recordings within 2 hours" },
    { icon: "🏭", label: "8 Industry Projects", sub: "Real BIW automotive parts" },
    { icon: "📜", label: "Govt. Certificate", sub: "Recognised by recruiters" },
    { icon: "💼", label: "Placement Support", sub: "50+ company referrals" },
    { icon: "❓", label: "Doubt Support", sub: "24-hour tutor response" },
    { icon: "♾", label: "Lifetime Access", sub: "All recordings forever" },
  ],
  syllabus: [
    {
      phase: "Phase 1 — Automotive Fundamentals (Days 1–30)", sessions: "Sessions 1–9",
      topics: ["BIW structure & automotive architecture","CATIA V5 BIW workbench tools","Sheet metal fundamentals & standards","Weld joint types and selection","GD&T for automotive components"],
    },
    {
      phase: "Phase 2 — BIW Component Design (Days 31–65)", sessions: "Sessions 10–22",
      topics: ["Floor pan & side member design","A/B/C-pillar design","Door inner & outer panel design","Roof panel & reinforcement design","Structural analysis for weight optimisation"],
    },
    {
      phase: "Phase 3 — Assembly & Joints (Days 66–90)", sessions: "Sessions 23–30",
      topics: ["BIW full body assembly","Weld flange and hem design","Sealing & adhesive locations","Hinge design & door movement study","DMU kinematics for door/hood motion"],
    },
    {
      phase: "Phase 4 — Industry Projects (Days 91–120)", sessions: "Sessions 31–35",
      topics: ["Project 1: Full door assembly BIW","Project 2: Front floor pan with cross-members","Project 3: Tailgate inner structure","5 Practice projects with expert review","Placement preparation & portfolio building"],
    },
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
    { q: "Do I need automotive background?", a: "No. We explain automotive architecture from scratch. Basic mechanical engineering understanding (diploma or degree level) is enough." },
    { q: "Which software is used?", a: "CATIA V5 with BIW workbench. A standard laptop with 8GB RAM, i5 or above is sufficient." },
    { q: "What companies hire BIW designers?", a: "TATA Motors, Mahindra, Maruti Suzuki, Force Motors, TATA ELXSI, Capgemini, SEGULA, and 50+ more in our network." },
    { q: "Are sessions live or recorded?", a: "All sessions are live + recorded. Recordings are in your portal within 2 hours. Lifetime access included." },
    { q: "What is the salary range after placement?", a: "Our placed students get ₹3.5 LPA to ₹6 LPA depending on company and location. Most freshers start at ₹4–5 LPA." },
    { q: "What if I miss a session?", a: "Every session is recorded. Watch at your own pace and ask questions on the portal anytime." },
  ],
  placements: ["TATA Motors","Mahindra","SEGULA","Capgemini","TATA ELXSI","Force Motors","Wipro","L&T"],
};

export default function BIWProductDesignPage() {
  return <CoursePage course={COURSE} />;
}
