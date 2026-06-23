import CoursePage from "./CoursePage.jsx";

const T = "BIW Product Design";

const COURSE = {
  slug: "biw-product-design",
  name: "BIW Product Design",
  tagline: "Master Automotive Body-in-White Design With OEM-Level Workflow",
  heroCopy:
    "Learn BIW fundamentals, nomenclature, material selection, manufacturing logic, DFM/DFA, master sections and CATIA-based Roof + Hood assembly projects with interview-ready practice assignments.",
  eyebrow: "Automotive BIW Career Program",
  badge: "🚀 Industry Favourite",
  badgeBg: "#037EC4",
  badgeColor: "#fff",

  price: 18000,
  regularOfferPrice: 18000,
  slashPrice: 22000,

  rating: "4.8",
  reviews: "180+",
  enrolled: "180+",
  duration: "4 Months",
  sessions: "45",
  projectCount: "4",
  roadmapLabel: "80 days training roadmap",
  offerInfoItems: [
    {
      title: "Learn BIW in CATIA V5",
      text: "BIW fundamentals + CATIA project workflow with Roof Assembly, Hood Assembly and practice assignments.",
    },
    {
      title: "Live + lifetime recording",
      text: "Live Zoom sessions with lifetime recording access for revision.",
    },
  ],

  tools: [
    "CATIA V5 BIW",
    "Master Sections",
    "Stamping",
    "Welding",
    "DFM/DFA",
    "GD&T",
  ],
  packageRange: "₹3.5–16 LPA",
  trustYears: "7+",
  partnerLine:
    "Digital CAD Training is partner and authorized by CADPOINT for professional CAD training direction.",
  trustCopy:
    "Students see the complete syllabus, project roadmap, career path and registration value clearly before joining. The program is structured for practical BIW design confidence.",
  packageNote:
    "Package depends on skill, location, interview performance and company requirement. We guide students with portfolio, resume direction, mock interview preparation and PAN India job updates.",
  trustHighlights: [
    "CADPOINT Authorized Partner",
    "PAN India MNC/OEM hiring exposure",
    "Practical BIW portfolio projects",
  ],
  trustProofs: [
    {
      title: "BIW design workflow",
      text: "Topics move from BIW basics to nomenclature, crashworthiness, material selection, manufacturing process, DFM/DFA and master sections.",
    },
    {
      title: "Project-first learning",
      text: "Students build Roof and Hood assembly projects and complete Door + B-Pillar practice assignments.",
    },
    {
      title: "Placement-focused mentoring",
      text: "CV building, mock interviews, portfolio explanation and job-sharing support are connected with the course journey.",
    },
  ],
  tutor: {
    name: "Balkrishna Dhuri",
    exp: "12+ Years Experience",
    companies: "Automotive Engineering Expert",
    initial: "B",
  },

  outcomes: [
    "Understand BIW upper body, underbody and closure nomenclature with functional requirements",
    "Explain BIW vehicle development process, crashworthiness, material selection and manufacturing process",
    "Apply DFM/DFA thinking for stamping, welding and assembly constraints",
    "Read and use master sections for BIW design decisions",
    "Build Roof Assembly and Hood Assembly project workflow in CATIA",
    "Prepare BIW portfolio explanation, CV and interview answers",
  ],

  includes: [
    {
      icon: "📅",
      label: "80 days training roadmap",
      sub: "Live sessions + lifetime recordings",
    },
    {
      icon: "🚗",
      label: "4 BIW projects",
      sub: "Roof, Hood, Door and B-Pillar workflow",
    },
    {
      icon: "📊",
      label: "Project documentation",
      sub: "DVP, BOM, design checks and portfolio proof",
    },
    {
      icon: "💼",
      label: "Placement support",
      sub: "CV building + technical mock interviews",
    },
    {
      icon: "❓",
      label: "Doubt support",
      sub: "Project correction and guidance",
    },
    {
      icon: "♾",
      label: "Lifetime access",
      sub: "Recordings for revision anytime",
    },
  ],

  syllabusSessions: [
    { no: 1, title: "BIW Introduction", trainer: T, category: "Fundamentals" },
    {
      no: 2,
      title: "BIW Nomenclature – Upper Body",
      trainer: T,
      category: "Nomenclature",
    },
    {
      no: 3,
      title: "BIW Nomenclature – Under Body",
      trainer: T,
      category: "Nomenclature",
    },
    {
      no: 4,
      title: "BIW Nomenclature – Closures",
      trainer: T,
      category: "Nomenclature",
    },
    {
      no: 5,
      title: "BIW Vehicle Development Process – Digital Activities",
      trainer: T,
      category: "Development Process",
    },
    {
      no: 6,
      title: "BIW Vehicle Development Process – Physical Activities",
      trainer: T,
      category: "Development Process",
    },
    {
      no: 7,
      title: "BIW Crashworthiness – Crash Tests and Regulations",
      trainer: T,
      category: "Crashworthiness",
    },
    {
      no: 8,
      title: "BIW Crashworthiness – Design for Better Crash Performance",
      trainer: T,
      category: "Crashworthiness",
    },
    {
      no: 9,
      title: "BIW Material Selection – Steel Grades and Types",
      trainer: T,
      category: "Materials",
    },
    {
      no: 10,
      title: "BIW Material Selection – AHSS Steels and Aluminium Alloys",
      trainer: T,
      category: "Materials",
    },
    {
      no: 11,
      title: "BIW Manufacturing Process – Stamping and Welding",
      trainer: T,
      category: "Manufacturing",
    },
    {
      no: 12,
      title: "BIW Manufacturing Process – Hemming and Painting",
      trainer: T,
      category: "Manufacturing",
    },
    {
      no: 13,
      title: "BIW DFM/DFA – Stamping Design Considerations",
      trainer: T,
      category: "DFM/DFA",
    },
    {
      no: 14,
      title: "BIW DFM/DFA – Welding and Assembly Considerations",
      trainer: T,
      category: "DFM/DFA",
    },
    {
      no: 15,
      title: "BIW Master Section and Requirements",
      trainer: T,
      category: "Master Section",
    },

    {
      no: 16,
      title: "Roof Assembly Project – Introduction, Inputs and Benchmarking",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 17,
      title: "Roof Assembly Project – Front and Rear Roof Rail Master Section",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 18,
      title: "Roof Assembly Project – Roof Bow and Roof Drip Master Section",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 19,
      title:
        "Roof Assembly Project – Front Roof Rail and Rear Roof Rail CAD Creation",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 20,
      title:
        "Roof Assembly Project – Roof Panel Radius, Trimline and Side Flange Definition",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 21,
      title: "Roof Assembly Project – Roof Bow Creation and Connection Data",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 22,
      title:
        "Roof Assembly Project – Joggle, Emboss, Diabolo Emboss and Stiffener Bead",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 23,
      title: "Roof Assembly Project – Draft Analysis",
      trainer: T,
      category: "Roof Project",
    },
    {
      no: 24,
      title: "Roof Assembly Project – Weld Creation, BOM and DVP Explanation",
      trainer: T,
      category: "Roof Project",
    },

    {
      no: 25,
      title:
        "Hood Assembly Project – Introduction, Inputs, Benchmarking and Design Concept Sheet",
      trainer: T,
      category: "Hood Project",
    },
    {
      no: 26,
      title: "Hood Assembly Project – Hood Master Section",
      trainer: T,
      category: "Hood Project",
    },
    {
      no: 27,
      title: "Hood Assembly Project – Hood Outer Panel Hemming Creation",
      trainer: T,
      category: "Hood Project",
    },
    {
      no: 28,
      title: "Hood Assembly Project – Hood Inner Panel CAD Creation Part 1",
      trainer: T,
      category: "Hood Project",
    },
    {
      no: 29,
      title: "Hood Assembly Project – Hood Inner Panel CAD Creation Part 2",
      trainer: T,
      category: "Hood Project",
    },
    {
      no: 30,
      title: "Hood Assembly Project – Hood Assembly DVP Explanation",
      trainer: T,
      category: "Hood Project",
    },

    {
      no: 31,
      title: "CV Building Session",
      trainer: "Career Support",
      category: "Career",
    },
    {
      no: 32,
      title: "Technical Mock Interview 1",
      trainer: "Career Support",
      category: "Interview",
    },
    {
      no: 33,
      title: "Technical Mock Interview 2",
      trainer: "Career Support",
      category: "Interview",
    },
    {
      no: 34,
      title: "Portfolio Explanation and Final Review",
      trainer: "Career Support",
      category: "Interview",
    },
  ],

  projectPracticeSessions: [
    {
      no: 35,
      title:
        "Door Assembly Practice Assignment – Input Study and Master Section",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 36,
      title: "Door Assembly Practice Assignment – Inner Panel Design Logic",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 37,
      title:
        "Door Assembly Practice Assignment – Hemming, Reinforcement and Mounting Areas",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 38,
      title: "Door Assembly Practice Assignment – DFM/DFA and Draft Review",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 39,
      title:
        "Door Assembly Practice Assignment – Documentation and Interview Explanation",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 40,
      title: "B-Pillar Practice Assignment – Input Study and Load Path",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 41,
      title:
        "B-Pillar Practice Assignment – Master Section and Reinforcement Logic",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 42,
      title: "B-Pillar Practice Assignment – CAD Creation Workflow",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 43,
      title:
        "B-Pillar Practice Assignment – Crashworthiness and Mounting Review",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 44,
      title: "B-Pillar Practice Assignment – Report and Portfolio Explanation",
      trainer: "Project Practice",
      category: "Project",
    },
    {
      no: 45,
      title: "Final BIW Project Review and Interview Readiness",
      trainer: "Project Practice",
      category: "Project",
    },
  ],

  projectLibrary: [
    "Door Assembly Practice Assignment",
    "B-Pillar Practice Assignment",
  ],
  portfolioProjects: [
    {
      no: 1,
      title: "Hood Assembly",
      area: "BIW Closure Design",
      desc: "Hood master section, hemming, inner panel CAD creation and DVP explanation.",
      frontImage: "images/Projects/biwproduct/hood_inner.jpeg",
      backImage: "images/Projects/biwproduct/hood_outer.jpeg",
    },
    {
      no: 2,
      title: "Door Assembly Practice",
      area: "BIW Closure Practice",
      desc: "Door assembly practice assignment for inner panel logic, hemming and reinforcement areas.",
      frontImage: "images/Projects/biwproduct/door_inner.jpeg",
      backImage: "images/Projects/biwproduct/door_outer.jpeg",
    },
    {
      no: 3,
      title: "B-Pillar Practice",
      area: "Pillar Design Practice",
      desc: "B-Pillar practice assignment for load path, reinforcement and crashworthiness explanation.",
      frontImage: "images/Projects/biwproduct/b-pillar-inner.jpeg",
      backImage: "images/Projects/biwproduct/b-pillar-outer.jpeg",
    },
    {
      no: 4,
      title: "Tailgate Assembly",
      area: "BIW Closure Design",
      desc: "Tailgate inner and outer panel reference for closure design understanding and practice.",
      frontImage: "images/Projects/biwproduct/tailgate_inner.jpeg",
      backImage: "images/Projects/biwproduct/tailgate_outer.jpeg",
    },
  ],

  courseFaqs: [
    {
      q: "Do I need prior BIW experience?",
      a: "No. The course starts from BIW fundamentals and moves toward practical CATIA-based project workflow.",
    },
    {
      q: "Which software is used?",
      a: "The BIW course is focused on CATIA V5 BIW/product design workflow.",
    },
    {
      q: "How many projects are included?",
      a: "The main live projects are Roof Assembly and Hood Assembly. Door Assembly and B-Pillar are added as practice assignments.",
    },
    {
      q: "Will this help in interviews?",
      a: "Yes. CV building, portfolio explanation and mock interviews are included in the roadmap.",
    },
  ],
};

export default function BIWProductDesign() {
  return <CoursePage course={COURSE} />;
}
