import { CalendarDays, Clock, User, Radio, FileText, HelpCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button, ChipBtn } from "../ui/index.jsx";

export default function SessionCard({ session, variant = "student", onAssignment, onAskQuestion, onViewQueries, onGoToSession, index = 0 }) {
  const isActive = session.status === "active";
  const isCompleted = session.status === "completed";

  return (
    <motion.div className="dct-card p-5 sm:p-6"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-dct-dark mb-0.5">{session.title}</h3>
        <p className="text-sm font-semibold text-dct-primary">Topic : {session.topic}</p>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">Session Date</p>
          <p className="text-sm font-bold text-dct-dark">{session.date}</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">Session Time</p>
          <p className="text-sm font-bold text-dct-dark">{session.time}</p>
        </div>
      </div>

      {/* Mentor + Type */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-dct-gray" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dct-dark">{session.mentorName}</p>
            <p className="text-xs text-dct-lightgray">Mentor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Radio size={14} className="text-dct-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dct-dark">{session.type}</p>
            <p className="text-xs text-dct-lightgray">{session.durationMin} minutes</p>
          </div>
        </div>
      </div>

      {/* Action chips */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <ChipBtn icon={FileText} label={variant === "tutor" ? "Assignment" : (session.status === "pending" ? "Assignment" : "View Assignment")} onClick={onAssignment} />
        <ChipBtn icon={HelpCircle} label={variant === "tutor" ? "View Queries" : "Ask a Question"} onClick={variant === "tutor" ? onViewQueries : onAskQuestion} />
      </div>

      {/* CTA Button */}
      <Button fullWidth variant={isCompleted ? "outline" : "primary"} onClick={onGoToSession}
        className={isCompleted ? "opacity-60" : ""}>
        Go to Session
      </Button>
    </motion.div>
  );
}
