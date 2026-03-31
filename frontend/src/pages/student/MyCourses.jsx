import AppShell from "../../components/layout/AppShell.jsx";
import { MY_COURSES, FREE_COURSES } from "../../constants/dummyData.js";
import { ProgressBar, PageWrapper } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";

function CourseCard({ course, index }) {
  const isProgress = course.status === "in-progress";
  return (
    <motion.div className={`dct-card overflow-hidden ${isProgress ? "ring-2 ring-dct-primary/20" : ""}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.08 }}
      whileHover={{ y: -2 }}>
      <div className="h-44 overflow-hidden relative">
        <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="p-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${isProgress ? "bg-blue-100 text-dct-primary" : "bg-green-100 text-green-700"}`}>
          {isProgress ? "In Progress" : "Completed"}
        </span>
        <h3 className="font-bold text-dct-dark text-sm mb-1">{course.title}</h3>
        <p className="text-xs text-dct-lightgray mb-3">{course.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="border border-gray-100 rounded-lg p-2.5">
            <p className="text-xs font-bold text-dct-dark">{course.startDate}</p>
            <p className="text-[10px] text-dct-lightgray">Start Date</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-2.5">
            <p className="text-xs font-bold text-dct-dark">{course.endDate}</p>
            <p className="text-[10px] text-dct-lightgray">End Date</p>
          </div>
        </div>

        <ProgressBar value={course.progressPct} color={isProgress ? "bg-dct-primary" : "bg-green-500"} />

        <div className="flex items-center gap-2 mt-3">
          <div className="w-8 h-8 rounded-full bg-dct-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {course.mentorName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-dct-dark">{course.mentorName}</p>
            <p className="text-[10px] text-dct-lightgray">Personal Trainer</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FreeCourseCard({ course, index }) {
  return (
    <motion.div className="dct-card p-4 relative"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 + index * 0.07 }}
      whileHover={{ y: -2 }}>
      <span className="absolute top-3 right-3 bg-pink-100 text-pink-600 text-xs font-bold px-2.5 py-0.5 rounded-full">Free</span>
      <div className="w-14 h-14 mb-3 flex items-center justify-center">
        {course.logoText === "CATIA" ? (
          <div className="w-12 h-12 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <text x="4" y="32" fontSize="18" fontWeight="900" fill="#e63946">3</text>
              <text x="18" y="32" fontSize="18" fontWeight="900" fill="#1a1a2e">DS</text>
            </svg>
          </div>
        ) : (
          <div className="w-12 h-12 rounded bg-dct-primary/10 flex items-center justify-center text-dct-primary font-black text-lg">{course.logoText}</div>
        )}
      </div>
      <h3 className="font-bold text-dct-dark text-sm mb-3">{course.title}</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-sm font-bold text-dct-dark">{course.sessions} Sessions</p>
          <p className="text-xs text-dct-lightgray">No. of Sessions</p>
        </div>
        <div>
          <p className="text-sm font-bold text-dct-dark">{course.duration}</p>
          <p className="text-xs text-dct-lightgray">Course Duration</p>
        </div>
      </div>
      <button className="w-full bg-dct-primary hover:bg-dct-blue text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
        View Course
      </button>
    </motion.div>
  );
}

export default function MyCourses() {
  return (
    <AppShell>
      <PageWrapper>
        {/* Refer banner */}
        <motion.div className="rounded-2xl p-6 mb-6 flex items-center justify-between overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #024981 0%, #007BBF 100%)" }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
          <div>
            <h2 className="text-white font-bold text-lg mb-1">
              Refer and <span className="text-yellow-300 underline">Earn ₹500</span> Cash points.
            </h2>
            <p className="text-white/80 text-sm mb-4">Feel free to recommend your friend</p>
            <button className="bg-dct-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-black transition-colors">
              Get Reward
            </button>
          </div>
          <div className="hidden sm:block w-32 h-24 opacity-80">
            <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="35" y="5" width="30" height="50" rx="5" fill="white" fillOpacity="0.3"/>
              <rect x="38" y="10" width="24" height="36" rx="3" fill="white" fillOpacity="0.2"/>
              <circle cx="50" cy="58" r="3" fill="white" fillOpacity="0.4"/>
              <circle cx="20" cy="40" r="10" fill="white" fillOpacity="0.25"/>
              <circle cx="90" cy="30" r="8" fill="white" fillOpacity="0.25"/>
              <circle cx="100" cy="60" r="12" fill="white" fillOpacity="0.2"/>
              <path d="M25 35 Q50 15 85 28" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" fillOpacity="0.5"/>
            </svg>
          </div>
        </motion.div>

        {/* My Courses */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-dct-dark">My Courses</h2>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {MY_COURSES.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
        </div>

        {/* Free Courses */}
        <h2 className="text-xl font-bold text-dct-dark mb-4">Explore These Free Courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FREE_COURSES.map((c, i) => <FreeCourseCard key={c.id} course={c} index={i} />)}
        </div>
      </PageWrapper>
    </AppShell>
  );
}
