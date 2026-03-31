// ─── Auth ─────────────────────────────────────────────────
export const MOCK_USER = {
  id: "u1", name: "Divya Angane", role: "student",
  phone: "+91 1234567890", email: "divya@example.com",
};
export const MOCK_TUTOR = {
  id: "t1", name: "Balkrishna Dhuri", role: "tutor",
  phone: "+91 9876543210", email: "balkrishna@example.com",
};

// ─── Courses ──────────────────────────────────────────────
export const MY_COURSES = [
  { id:"c1", title:"Plastic Product Design Course", description:"Innovative training in plastic product design",
    status:"in-progress", startDate:"Oct 25, 2024", endDate:"Jan 25, 2025",
    mentorName:"Sameer Dhuri", progressPct:70,
    coverImage:"https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&q=80" },
  { id:"c2", title:"BIW Product Design Course", description:"Innovative training in plastic product design",
    status:"completed", startDate:"Oct 25, 2024", endDate:"Jan 25, 2025",
    mentorName:"Sameer Dhuri", progressPct:100,
    coverImage:"https://images.unsplash.com/photo-1565514158740-064f34bd5cfd?w=600&q=80" },
];

export const FREE_COURSES = [
  { id:"f1", title:"CATIA Tool for Beginners", sessions:10, duration:"2hrs, 50mins", logoText:"CATIA", logoColor:"#e63946" },
  { id:"f2", title:"Ugnx Tool for Beginners",  sessions:10, duration:"2hrs, 50mins", logoText:"NX",    logoColor:"#007BBF" },
];

// ─── Sessions ─────────────────────────────────────────────
const base = { mentorName:"Balkrishna Dhuri", durationMin:90, type:"Live Session", date:"19/06/2025", time:"8:00 AM To 9:00 PM" };

export const ALL_SESSIONS = [
  { id:"s1", courseId:"c1", title:"Plastic Product Design Course Session 1", topic:"CATIA Surfacing Session 01", status:"active",   ...base },
  { id:"s2", courseId:"c1", title:"Plastic Product Design Course Session 2", topic:"CATIA Surfacing Session 02", status:"upcoming", ...base },
  { id:"s3", courseId:"c1", title:"Plastic Product Design Course Session 3", topic:"CATIA Surfacing Session 03", status:"upcoming", ...base },
  { id:"s4", courseId:"c1", title:"Plastic Product Design Course Session 4", topic:"CATIA Surfacing Session 04", status:"completed",...base },
  { id:"s5", courseId:"c1", title:"Plastic Product Design Course Session 5", topic:"CATIA Surfacing Session 05", status:"completed",...base },
];

export const UPCOMING_SESSIONS  = ALL_SESSIONS.filter(s => s.status === "active" || s.status === "upcoming");
export const COMPLETED_SESSIONS = ALL_SESSIONS.filter(s => s.status === "completed");

// ─── Assignments (Student) ────────────────────────────────
export const ALL_ASSIGNMENTS = [
  { id:"a1", title:"Session 1 Assignment", topic:"CATIA Surfacing Session 01",
    sessionDate:"19/06/2025", dueDate:"21/06/2025", submittedOn:null, status:"pending",
    fileName:null },
  { id:"a2", title:"Session 1 Assignment", topic:"CATIA Surfacing Session 01",
    sessionDate:"19/06/2025", dueDate:"21/06/2025", submittedOn:"21/06/2025", status:"submitted",
    fileName:"Assignment 1_Batch 1.CATPart" },
  { id:"a3", title:"Session 1 Assignment", topic:"CATIA Surfacing Session 01",
    sessionDate:"19/06/2025", dueDate:"21/06/2025", submittedOn:"21/06/2025", status:"submitted",
    fileName:"Assignment 1_Batch 1.CATPart" },
];

export const ASSIGNMENT_FEEDBACKS = [
  { id:"af1", title:"Session 1 Assignment", topic:"CATIA Surfacing Session 01",
    sessionDate:"19/06/2025", submittedOn:"21/06/2025",
    studentName:"Sanjay Patil", assignmentName:"CATIA Surfacing Session 1 Assignment",
    sessionName:"Session 1 Assignment", fileName:"Assignment 1_Batch 1.CATPart",
    tutorFeedback:"Great job on this assignment. Your understanding is clear and well presented. With a bit more depth and examples, it will become even stronger." },
  { id:"af2", title:"Session 2 Assignment", topic:"CATIA Surfacing Session 01",
    sessionDate:"19/06/2025", submittedOn:"21/06/2025",
    studentName:"Sanjay Patil", assignmentName:"CATIA Surfacing Session 2 Assignment",
    sessionName:"Session 2 Assignment", fileName:"Assignment 2_Batch 1.CATPart",
    tutorFeedback:"Good effort. Please review the surfacing techniques more carefully." },
];

// ─── Queries ──────────────────────────────────────────────
export const MY_QUERIES = [
  { id:"q1", studentName:"Sanjay Patil", batch:"September Batch 2025",
    date:"21 Feb 2025, 10:30 am", status:"unresolved",
    label:"Student Query",
    message:"Hi Bob,\n\nWith respect, i must disagree with Mr.Zinsser. We all know the most part of important part of any article is the title. Without a compelling title, your reader won't even get to the first sentence. After the title, however, the first few sentences of your article are certainly the most important part.",
    reply: { name:"Sammer Dhuri", title:"Plastic Product Design Tutor", date:"21 Feb 2025, 10:30 am",
      label:"Tutor Reply", resolved:true,
      message:"Hi Bob,\n\nWith respect, i must disagree with Mr.Zinsser. We all know the most part of important part of any article is the title. Without a compelling title, your reader won't even get to the first sentence. After the title, however, the first few sentences of your article are certainly the most important part." }
  },
];

// ─── Batches (Tutor) ──────────────────────────────────────
export const BATCHES_2025 = [
  { id:"b1", year:"2025", monthLabel:"Jul", title:"Plastic Product Design", mentorName:"Sameer Dhuri", startDate:"Jul 25, 2024", endDate:"Sep 25, 2025", progressPct:70,  status:"in-progress" },
  { id:"b2", year:"2025", monthLabel:"Aug", title:"Plastic Product Design", mentorName:"Sameer Dhuri", startDate:"Jul 25, 2024", endDate:"Sep 25, 2025", progressPct:70,  status:"in-progress" },
  { id:"b3", year:"2025", monthLabel:"Sept",title:"Plastic Product Design", mentorName:"Sameer Dhuri", startDate:"Jul 25, 2024", endDate:"Sep 25, 2025", progressPct:70,  status:"in-progress" },
  { id:"b4", year:"2025", monthLabel:"Oct", title:"Plastic Product Design", mentorName:"Sameer Dhuri", startDate:"Jul 25, 2024", endDate:"Sep 25, 2025", progressPct:100, status:"completed" },
];
export const BATCHES_2024 = [
  { id:"b5", year:"2024", monthLabel:"Jan", title:"Plastic Product Design", mentorName:"Sameer Dhuri", startDate:"Jan 10, 2024", endDate:"Apr 10, 2024", progressPct:100, status:"completed" },
];

// ─── Tutor – Student Assignments ──────────────────────────
export const TUTOR_STUDENT_ASSIGNMENTS = [
  { id:"ta1", studentName:"Sanjay Patil", batch:"September Batch 2025",
    title:"Session 1 Assignment", topic:"CATIA Surfacing Session 01",
    date:"21 Feb 2025, 10:30 am", status:"unchecked",
    assignmentName:"CATIA Corse Assignment 1", fileName:"Assignment 1_Batch 1.CATPart",
    sessionName:"Session 1 Assignment", sessionTopic:"(Topic: CATIA Surfacing Session 1)" },
  { id:"ta2", studentName:"Sanjay Patil", batch:"September Batch 2025",
    title:"Session 1 Assignment", topic:"CATIA Surfacing Session 01",
    date:"21 Feb 2025, 10:30 am", status:"unchecked",
    assignmentName:"CATIA Corse Assignment 1", fileName:"Assignment 1_Batch 1.CATPart",
    sessionName:"Session 1 Assignment", sessionTopic:"(Topic: CATIA Surfacing Session 1)" },
];

// ─── Tutor – Session Queries ──────────────────────────────
export const SESSION_QUERIES = [
  { id:"sq1", studentName:"Sanjay Patil", batch:"September Batch 2025",
    date:"21 Feb 2025, 10:30 am", status:"unresolved",
    message:"Hi Bob,\n\nWith respect, i must disagree with Mr.Zinsser. We all know the most part of important part of any article is the title." },
  { id:"sq2", studentName:"Sanjay Patil", batch:"September Batch 2025", date:"21 Feb 2025, 10:30 am", status:"unresolved", message:"" },
  { id:"sq3", studentName:"Sanjay Patil", batch:"September Batch 2025", date:"21 Feb 2025, 10:30 am", status:"unresolved", message:"" },
  { id:"sq4", studentName:"Sanjay Patil", batch:"September Batch 2025", date:"21 Feb 2025, 10:30 am", status:"unresolved", message:"" },
  { id:"sq5", studentName:"Sanjay Patil", batch:"September Batch 2025", date:"21 Feb 2025, 10:30 am", status:"unresolved", message:"" },
  { id:"sq6", studentName:"Sanjay Patil", batch:"September Batch 2025", date:"21 Feb 2025, 10:30 am", status:"unresolved", message:"" },
];

export const SESSION_LIST_NAMES = [
  "Session 1 – CATIA Surfacing",
  "Session 2 – CATIA Surfacing",
  "Session 3 – Sheet Metal",
  "Session 4 – Assembly Design",
];

// ─── Admin Mock Data ────────────────────────────────────────
export const MOCK_ADMIN = {
  id: "a1", name: "Admin User", role: "admin",
  email: "admin@digitalcad.com",
};

export const ADMIN_STATS = {
  totalStudents: 312,
  activeStudents: 287,
  totalTutors: 8,
  pendingApprovals: 3,
  activeBatches: 11,
  completedBatches: 24,
  totalRevenue: 487500,
  monthRevenue: 52000,
  totalQueries: 48,
  unresolvedQueries: 12,
};

export const PENDING_TUTORS = [
  {
    id: "pt1", name: "Rohit Sharma", email: "rohit@example.com", phone: "+91 9823456781",
    occupation: "Working Professional", yearsExp: 7, companies: "Bajaj Auto, Mahindra",
    workExp: "7 years in automotive plastic part design and CATIA V5 surfacing at Bajaj Auto.",
    location: "Pune, Maharashtra", languages: ["Hindi", "Marathi", "English"],
    timeSlots: ["8:00–9:00 PM", "9:00–10:00 PM"],
    sessions: 12, projects: 3, appliedOn: "2025-03-01", status: "pending",
  },
  {
    id: "pt2", name: "Sneha Kulkarni", email: "sneha@example.com", phone: "+91 9823456782",
    occupation: "Freelancer", yearsExp: 5, companies: "Tata Technologies",
    workExp: "5 years in product design focusing on NX and CATIA mould design.",
    location: "Nashik, Maharashtra", languages: ["Marathi", "English"],
    timeSlots: ["8:30–9:30 PM"],
    sessions: 9, projects: 2, appliedOn: "2025-03-03", status: "pending",
  },
  {
    id: "pt3", name: "Arjun Nair", email: "arjun@example.com", phone: "+91 9823456783",
    occupation: "Retired Expert", yearsExp: 18, companies: "L&T, Thermax, John Deere",
    workExp: "18 years in heavy equipment design and BIW with deep expertise in GD&T and tolerance analysis.",
    location: "Bengaluru, Karnataka", languages: ["English", "Kannada", "Malayalam"],
    timeSlots: ["9:00–10:00 PM", "Need to Discuss"],
    sessions: 20, projects: 5, appliedOn: "2025-03-05", status: "pending",
  },
];

export const APPROVED_TUTORS = [
  { id: "at1", name: "Balkrishna Dhuri", email: "balkrishna@example.com", phone: "+91 9876543210",
    occupation: "Full-time Tutor", yearsExp: 10, activeBatches: 3, totalStudents: 78, rating: 4.8 },
  { id: "at2", name: "Priya Joshi", email: "priya@example.com", phone: "+91 9812345678",
    occupation: "Working Professional", yearsExp: 6, activeBatches: 2, totalStudents: 45, rating: 4.6 },
];

export const ALL_STUDENTS = [
  { id: "s1", name: "Divya Angane",   email: "divya@example.com",   phone: "+91 1234567890", batch: "Plastic Product Design – Sep 2024", tutor: "Balkrishna Dhuri", progress: 70, status: "active",   joinedOn: "2024-09-01" },
  { id: "s2", name: "Rahul Patil",    email: "rahul@example.com",   phone: "+91 9012345678", batch: "CATIA Surfacing – Jan 2025",        tutor: "Balkrishna Dhuri", progress: 45, status: "active",   joinedOn: "2025-01-10" },
  { id: "s3", name: "Meena Iyer",     email: "meena@example.com",   phone: "+91 9112345678", batch: "UG NX Basics – Nov 2024",           tutor: "Priya Joshi",      progress: 90, status: "active",   joinedOn: "2024-11-05" },
  { id: "s4", name: "Amit Deshmukh",  email: "amit@example.com",    phone: "+91 9212345678", batch: "Plastic Product Design – Sep 2024", tutor: "Balkrishna Dhuri", progress: 100,status: "completed",joinedOn: "2024-09-01" },
  { id: "s5", name: "Kavita Rao",     email: "kavita@example.com",  phone: "+91 9312345678", batch: "CATIA Surfacing – Jan 2025",        tutor: "Priya Joshi",      progress: 30, status: "active",   joinedOn: "2025-01-15" },
  { id: "s6", name: "Sandeep More",   email: "sandeep@example.com", phone: "+91 9412345678", batch: "UG NX Basics – Nov 2024",           tutor: "Priya Joshi",      progress: 60, status: "active",   joinedOn: "2024-11-05" },
];

export const ADMIN_ALL_QUERIES = [
  { id: "q1", student: "Divya Angane",  batch: "PPD Sep 2024", session: "Session 5", question: "How do I apply draft analysis on curved surfaces in CATIA?", date: "2025-02-15", status: "unresolved", tutor: "Balkrishna Dhuri" },
  { id: "q2", student: "Rahul Patil",   batch: "CATIA Jan 2025", session: "Session 2", question: "Can you share more practice files for surfacing?", date: "2025-02-18", status: "resolved",   tutor: "Balkrishna Dhuri" },
  { id: "q3", student: "Meena Iyer",    batch: "NX Nov 2024",  session: "Session 7", question: "The synchronous modeling toolbar is not visible in my NX.", date: "2025-02-20", status: "unresolved", tutor: "Priya Joshi" },
  { id: "q4", student: "Kavita Rao",    batch: "CATIA Jan 2025", session: "Session 1", question: "I missed session 3, is a recording available?", date: "2025-02-22", status: "resolved",   tutor: "Priya Joshi" },
  { id: "q5", student: "Sandeep More",  batch: "NX Nov 2024",  session: "Session 9", question: "Tooling direction method not working as shown in class.", date: "2025-02-25", status: "unresolved", tutor: "Priya Joshi" },
];

export const ADMIN_BATCHES = [
  { id: "b1", name: "Plastic Product Design",  tutor: "Balkrishna Dhuri", startDate: "Sep 2024", endDate: "Mar 2025", students: 28, progress: 85, status: "active" },
  { id: "b2", name: "CATIA Surfacing Advanced", tutor: "Balkrishna Dhuri", startDate: "Jan 2025", endDate: "Jun 2025", students: 22, progress: 40, status: "active" },
  { id: "b3", name: "UG NX Fundamentals",       tutor: "Priya Joshi",      startDate: "Nov 2024", endDate: "Apr 2025", students: 18, progress: 70, status: "active" },
  { id: "b4", name: "CATIA V5 Basics",          tutor: "Balkrishna Dhuri", startDate: "Jun 2024", endDate: "Nov 2024", students: 30, progress: 100,status: "completed" },
  { id: "b5", name: "Mould Design",             tutor: "Priya Joshi",      startDate: "Aug 2024", endDate: "Jan 2025", students: 15, progress: 100,status: "completed" },
];
