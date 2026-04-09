import { useState } from "react";
import { ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressBar } from "../ui/index.jsx";

const DAYS = ["S","M","T","W","T","F","S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function CalendarWidget() {
  const [date, setDate] = useState(new Date(2022, 1, 1));
  const year = date.getFullYear(), month = date.getMonth();
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="dct-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setDate(new Date(year, month - 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-dct-gray">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-bold text-dct-dark">{MONTHS[month]} {year}</span>
        <button onClick={() => setDate(new Date(year, month + 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-dct-gray">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-dct-lightgray py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          const isToday = d === 15, isMarked = d === 16;
          return (
            <div key={i} className={`text-center text-xs py-1 rounded-full cursor-pointer transition-colors
              ${isToday ? "bg-dct-primary text-white font-bold" : ""}
              ${isMarked ? "bg-dct-navy text-white font-bold" : ""}
              ${d && !isToday && !isMarked ? "hover:bg-gray-100 text-dct-dark" : ""}
              ${!d ? "" : ""}`}>
              {d || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AttendanceWidget() {
  return (
    <div className="dct-card p-4">
      <h3 className="text-sm font-bold text-dct-dark mb-3">Attendance Markings</h3>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-dct-primary" />
          <span className="text-xs text-dct-gray font-medium">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-gray-200" />
          <span className="text-xs text-dct-gray font-medium">Present</span>
        </div>
      </div>
    </div>
  );
}

export function CompletionWidget({ pct = 70 }) {
  return (
    <div className="dct-card p-4">
      <h3 className="text-sm font-bold text-dct-dark mb-3">Course Completion Status</h3>
      <ProgressBar value={pct} />
      <p className="text-xs text-dct-gray mt-2 font-medium">{pct}% Completed</p>
    </div>
  );
}

export function ReferWidget({ onGetReward }) {
  return (
    <motion.div className="rounded-2xl overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #003C6E 0%, #007BBF 100%)" }}
      whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white text-sm font-semibold leading-snug mb-1">
              Refer and <span className="text-yellow-300 underline font-bold">Earn ₹500</span>
            </p>
            <p className="text-white/80 text-xs mb-4">Cash points.</p>
            <div className="flex gap-2">
              <button onClick={onGetReward} className="bg-dct-primary hover:bg-dct-blue text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                Get Reward
              </button>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
                How To
              </button>
            </div>
          </div>
          <div className="w-16 flex-shrink-0 ml-2">
            <div className="w-14 h-20 relative">
              {/* Phone illustration SVG */}
              <svg viewBox="0 0 56 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
                <rect x="8" y="2" width="40" height="68" rx="6" fill="white" fillOpacity="0.2"/>
                <rect x="11" y="8" width="34" height="52" rx="3" fill="white" fillOpacity="0.15"/>
                <circle cx="28" cy="67" r="3" fill="white" fillOpacity="0.4"/>
                <rect x="20" y="4" width="16" height="2" rx="1" fill="white" fillOpacity="0.4"/>
                <circle cx="18" cy="25" r="5" fill="#007BBF"/>
                <circle cx="38" cy="35" r="4" fill="#024981"/>
                <path d="M14 38 Q28 20 42 30" stroke="white" strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
