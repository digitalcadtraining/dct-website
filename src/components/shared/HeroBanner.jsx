import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function HeroBanner({ onAskQuestion }) {
  return (
    <motion.div className="rounded-2xl p-6 sm:p-8 flex items-center justify-between relative overflow-hidden mb-6"
      style={{ background: "linear-gradient(135deg, #024981 0%, #007BBF 100%)" }}
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute right-20 -bottom-12 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Got Questions?</h2>
        <p className="text-white/80 text-sm mb-5">We are Here to Help you!</p>
        <button onClick={onAskQuestion}
          className="bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg backdrop-blur-sm">
          Ask a question
        </button>
      </div>

      <div className="relative z-10 hidden sm:flex items-center justify-center">
        <motion.div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
          animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
            <MessageCircle size={28} className="text-white" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
