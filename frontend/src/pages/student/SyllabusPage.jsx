import { useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import HeroBanner from "../../components/shared/HeroBanner.jsx";
import { CalendarWidget, AttendanceWidget, CompletionWidget, ReferWidget } from "../../components/shared/widgets.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import ReferralModal from "../../components/shared/ReferralModal.jsx";

const SYLLABUS = [
  { session: "Session 1", topic: "CATIA Surfacing Session 01" },
  { session: "Session 2", topic: "CATIA Surfacing Session 02" },
  { session: "Session 3", topic: "CATIA Surfacing Session 03" },
  { session: "Session 4", topic: "CATIA Surfacing Session 04" },
  { session: "Session 5", topic: "CATIA Surfacing Session 05" },
  { session: "Session 6", topic: "Automation Development Process" },
  { session: "Session 7", topic: "Benhmarking and Plastic Product Design Constrction" },
  { session: "Session 8", topic: "Mould Intro and Draft Analysis Process" },
  { session: "Session 9", topic: "Tooling Direction Creation Methods" },
  { session: "Session 10", topic: "Tooling Direction Creation Methods" },
];

export default function SyllabusPage() {
  const [referOpen, setReferOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <AppShell>
      <PageWrapper>
        <HeroBanner onAskQuestion={() => setAskOpen(true)} />

        <div className="flex gap-6 items-start">
          {/* Left – Syllabus list */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dct-dark mb-5">Plastic Product Design Syllabus</h2>

            <div className="dct-card overflow-hidden">
              {/* Session list */}
              <div className="divide-y divide-gray-100">
                {SYLLABUS.map((item, i) => (
                  <motion.div key={i}
                    className="flex flex-col px-6 py-4 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}>
                    <span className="text-sm font-bold text-dct-dark group-hover:text-dct-primary transition-colors">
                      {item.session}
                    </span>
                    <span className="text-xs font-semibold text-dct-primary mt-0.5">
                      Topic : {item.topic}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Download button */}
              <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
                <motion.button
                  className="flex items-center gap-2 border-2 border-dct-primary text-dct-primary hover:bg-dct-primary hover:text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all duration-200"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Download size={16} />
                  Download Syllabus PDF
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right – Widgets */}
          <div className="hidden xl:block w-64 flex-shrink-0 self-start sticky top-6 space-y-4">
            <CalendarWidget />
            <AttendanceWidget />
            <CompletionWidget pct={70} />
            {/* Refer widget — clicking opens referral modal */}
            <div onClick={() => setReferOpen(true)} className="cursor-pointer">
              <ReferWidget />
            </div>
          </div>
        </div>

        <ReferralModal isOpen={referOpen} onClose={() => setReferOpen(false)} />
      </PageWrapper>
    </AppShell>
  );
}
