import CoursePage from "./CoursePage.jsx";

const COURSE = {
  slug: "plastic-product-design",
  name: "Plastic Product Design",
  tagline: "From Zero to Industry-Ready in 4 Months",
  badge: "🏆 Most Popular",
  badgeBg: "#FFEB3A",
  badgeColor: "#1C1C1C",
  price: 18000,
  slashPrice: 24000,
  rating: "4.9",
  reviews: "312",
  enrolled: "312+",
  duration: "4 Months",
  sessions: "40+",
  projects: "11",
  tools: ["CATIA V5", "GSD Surfacing", "Mould Design", "GD&T", "Draft Analysis"],
  tutor: { name: "Balkrishna Dhuri", exp: "12 Years Experience", companies: "Ex-Bajaj Auto & L&T", initial: "B" },
  outcomes: [
    "Design complete plastic parts in CATIA V5 from scratch",
    "Apply Class A surfacing and generative shape design",
    "Create full mould designs — core, cavity, sliders & lifters",
    "Analyse draft, wall thickness and sink marks professionally",
    "Build a portfolio of 11 real automotive industry projects",
    "Clear technical interviews at Tier-1 automotive companies",
  ],
  includes: [
    { icon: "📹", label: "40+ Live Sessions", sub: "Recordings within 2 hours" },
    { icon: "🏭", label: "11 Industry Projects", sub: "3 live + 8 self-paced" },
    { icon: "📜", label: "Govt. Certificate", sub: "Recognised by recruiters" },
    { icon: "💼", label: "Placement Support", sub: "50+ company referrals" },
    { icon: "❓", label: "Doubt Support", sub: "24-hour tutor response" },
    { icon: "♾", label: "Lifetime Access", sub: "All recordings forever" },
  ],
  syllabus: [
    {
      phase: "Phase 1 — Foundation (Days 1–30)", sessions: "Sessions 1–10",
      topics: ["CATIA V5 interface & workbenches","Sketcher & Part Design basics","GD&T and 2D drawing standards","Assembly Design & constraints","Plastic design rules & wall thickness"],
    },
    {
      phase: "Phase 2 — Advanced Design (Days 31–60)", sessions: "Sessions 11–22",
      topics: ["Generative Shape Design (GSD)","Class A Surfacing techniques","Draft analysis & mould feasibility","Core & cavity extraction","Slider & lifter design"],
    },
    {
      phase: "Phase 3 — Mould Design (Days 61–85)", sessions: "Sessions 23–32",
      topics: ["Mould base layout & standards","Gate, runner & cooling channel design","Ejector system design","Mould simulation preparation","Real mould documentation"],
    },
    {
      phase: "Phase 4 — Industry Projects (Days 86–120)", sessions: "Sessions 33–40",
      topics: ["Live Project 1: Door Trim Panel full mould","Live Project 2: Dashboard Cup Holder","Live Project 3: Interior Armrest Assembly","8 Recorded practice projects","Portfolio preparation & interview coaching"],
    },
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
    { q: "Do I need prior CAD experience?", a: "No. We start from absolute zero — CATIA interface, basic tools, sketching — and build up to full mould design. Many placed students had never opened CATIA before joining." },
    { q: "What software do I need?", a: "CATIA V5. We guide you through installation and student licence options. A mid-range laptop (8GB RAM, Intel i5 or above) is sufficient." },
    { q: "How many hours per week?", a: "3 live sessions per week (Mon/Wed/Fri, 1.5 hrs each) plus 4–6 hours of self-practice. Designed for working professionals." },
    { q: "Are sessions recorded?", a: "Yes. Every session is recorded and available within 2 hours. Lifetime access included." },
    { q: "Is placement guaranteed?", a: "We provide 100% placement assistance — resume review, mock interviews, and referrals to 50+ hiring partners. 312 students placed so far." },
    { q: "Can I pay in EMI?", a: "Yes. Contact us on WhatsApp at +91 1234567890 to discuss EMI plans." },
  ],
  placements: ["ALSTOM","TATA ELXSI","Bajaj Auto","L&T","Wipro","Capgemini","FORCE MOTORS","Mahindra"],
};

export default function PlasticProductDesignPage() {
  return <CoursePage course={COURSE} />;
}
