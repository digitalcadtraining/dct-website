import { useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { ALL_SESSIONS, SESSION_QUERIES } from "../../constants/dummyData.js";
import { CompletionWidget, } from "../../components/shared/widgets.jsx";
import { Modal, Input, Textarea, Button, Avatar, ChipBtn, PageWrapper } from "../../components/ui/index.jsx";
import { FileText, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

function QueryCard({ query, index, onView }) {
  return (
    <motion.div className="dct-card p-4 cursor-pointer hover:shadow-card-hover transition-all"
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}
      onClick={() => onView(query)}>
      <div className="flex items-start gap-3 mb-2">
        <Avatar name={query.studentName} color="bg-dct-primary" size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-dct-dark">{query.studentName}</p>
          <p className="text-[10px] text-dct-lightgray truncate">{query.batch}</p>
        </div>
        <span className="status-badge-unresolved flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {query.status}
        </span>
      </div>
      <p className="text-[10px] text-dct-lightgray mb-1">{query.date}</p>
      {query.message && <p className="text-xs text-dct-dark line-clamp-3 leading-relaxed">{query.message}</p>}
      {query.message && (
        <button className="mt-2 bg-dct-primary text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-dct-blue transition-colors">
          View Query
        </button>
      )}
    </motion.div>
  );
}

export default function TutorSessionsPage() {
  const [selectedQuery, setSelectedQuery] = useState(null);

  return (
    <AppShell>
      <PageWrapper>
        <h2 className="text-xl font-bold text-dct-dark mb-5">September Batch Sessions</h2>
        <div className="flex gap-5 items-start">
          {/* Left – sessions */}
          <div className="flex-1 min-w-0 space-y-4">
            {ALL_SESSIONS.slice(0, 2).map((s, i) => (
              <motion.div key={s.id} className="dct-card p-5"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <h3 className="text-base font-bold text-dct-dark mb-0.5">{s.title}</h3>
                <p className="text-sm font-semibold text-dct-primary mb-4">Topic : {s.topic}</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                    <p className="text-[10px] text-dct-lightgray font-semibold uppercase mb-0.5">Session Date</p>
                    <p className="text-sm font-bold text-dct-dark">{s.date}</p>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                    <p className="text-[10px] text-dct-lightgray font-semibold uppercase mb-0.5">Session Time</p>
                    <p className="text-sm font-bold text-dct-dark">{s.time}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-dct-gray">👤</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dct-dark">{s.mentorName}</p>
                      <p className="text-xs text-dct-primary">Mentor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <span className="text-xs">📡</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dct-dark">{s.type}</p>
                      <p className="text-xs text-dct-lightgray">{s.durationMin} minutes</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <ChipBtn icon={FileText} label="Assignment" onClick={() => {}} />
                  <ChipBtn icon={HelpCircle} label="View Queries" onClick={() => {}} />
                </div>
                <Button fullWidth variant="primary">Go to Session</Button>
              </motion.div>
            ))}
          </div>

          {/* Right – stats + queries */}
          <div className="hidden xl:block w-72 flex-shrink-0 self-start sticky top-6 space-y-4">
            <CompletionWidget pct={70} />
            <div>
              <h3 className="text-sm font-bold text-dct-dark mb-3">Session Queries</h3>
              <div className="space-y-3">
                {SESSION_QUERIES.map((q, i) => (
                  <QueryCard key={q.id} query={q} index={i} onView={setSelectedQuery} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
