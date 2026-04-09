import { motion } from "framer-motion";

const CARDS = [
  { label: "Quality Content", sub: "Certification Rate", val: "95%", badge: "Industry-Level", badgeLabel: "Quality", extra: "Updates", extraVal: "Weekly", pos: "top-6 right-4" },
  { label: "299+", sub: "Students Enrolled", pos: "top-6 left-4" },
  { label: "Expert Mentors", sub: "10+ yrs Experience", stars: true, pos: "top-44 right-4" },
  { label: "78%", sub: "Completed", prefix: "Course Progress", pos: "top-32 left-4" },
  { label: "45", sub: "Real Projects", extra: "100%", extraSub: "Hands-on", prefix: "Practical Projects", pos: "bottom-12 right-4" },
];

export default function AuthHero() {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
      style={{ background: "linear-gradient(135deg, #003C6E 0%, #007BBF 100%)" }}>
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute bottom-10 -left-16 w-56 h-56 rounded-full bg-white/5" />

      <div className="relative z-10 text-center px-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-3xl font-bold text-white leading-tight mb-2">From Learning to</h2>
          <h2 className="text-3xl font-bold text-white leading-tight">Industry-Ready</h2>
          <p className="text-white/70 mt-3 text-sm">Join 299+ students mastering CAD skills</p>
        </motion.div>

        {/* Floating stat cards */}
        <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm mx-auto">
          {[
            { label: "Certification Rate", val: "95%", color: "bg-white" },
            { label: "Students Enrolled", val: "299+", color: "bg-white" },
            { label: "Course Progress", val: "78%", color: "bg-white", progress: true },
            { label: "Expert Mentors", val: "10+ yrs", color: "bg-white" },
            { label: "Real Projects", val: "45", color: "bg-white" },
            { label: "Hands-on", val: "100%", color: "bg-white" },
          ].map((card, i) => (
            <motion.div key={i} className="bg-white rounded-2xl p-4 text-left shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}>
              <p className="text-[10px] text-dct-gray font-semibold mb-1">{card.label}</p>
              <p className="text-xl font-bold text-dct-navy">{card.val}</p>
              {card.progress && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-dct-primary rounded-full" style={{ width: "78%" }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
