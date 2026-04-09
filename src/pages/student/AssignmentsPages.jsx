import { useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import HeroBanner from "../../components/shared/HeroBanner.jsx";
import { CalendarWidget, AttendanceWidget, CompletionWidget, ReferWidget } from "../../components/shared/widgets.jsx";
import { Modal, Input, Textarea, Button, ChipBtn, PageWrapper } from "../../components/ui/index.jsx";
import { ALL_ASSIGNMENTS, ASSIGNMENT_FEEDBACKS } from "../../constants/dummyData.js";
import { FileText, HelpCircle, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import ReferralModal from "../../components/shared/ReferralModal.jsx";

// ─── Submission Modal ───────────────────────────────────────
function SubmissionModal({ isOpen, onClose, session }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ name:"", assignmentName:"" });
  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Submission">
      <div className="space-y-4">
        <Input label="Enter Your Name" placeholder="Ex: September Batch 2025" value={form.name} onChange={set("name")} />
        <Input label="Assignment Name" placeholder="Ex. Session Assignment Name" value={form.assignmentName} onChange={set("assignmentName")} />
        <Input label="Session Name" value={session || "Session 1 Assignment"} readOnly />

        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Upload File</label>
          {file && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-2">
              <span className="text-sm font-semibold text-dct-primary truncate">{file.name}</span>
              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <span className="text-xs text-dct-gray">{Math.round(file.size / 1024)} KB</span>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
          <label className="border-2 border-dashed border-gray-200 hover:border-dct-primary rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors group">
            <Upload size={22} className="text-gray-300 group-hover:text-dct-primary transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-dct-primary transition-colors">Drag and Drop a file here or click</span>
            <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </label>
        </div>

        <Button onClick={onClose} variant="primary" size="md">Submit Assignment</Button>
      </div>
    </Modal>
  );
}

// ─── Student View Feedback Modal ────────────────────────────
function ViewFeedbackModal({ isOpen, onClose, feedback }) {
  if (!feedback) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Feedback">
      <div className="space-y-4">
        <Input label="Enter Your Name" value={feedback.studentName} readOnly />
        <Input label="Assignment Name" value={feedback.assignmentName} readOnly />
        <Input label="Session Name" value={feedback.sessionName} readOnly />
        <Input label="Assignment File" value={feedback.fileName} readOnly />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Tutor Feedback</label>
          <div className="dct-input bg-blue-50/50 text-dct-primary text-sm leading-relaxed min-h-[80px] py-3">
            {feedback.tutorFeedback}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Assignment Card ────────────────────────────────────────
function AssignmentCard({ assignment, onSubmit, onFeedback, index }) {
  const hasFile = assignment.status === "submitted";
  return (
    <motion.div className="dct-card p-5 sm:p-6"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.07 }}>
      <h3 className="text-base font-bold text-dct-dark mb-0.5">{assignment.title}</h3>
      <p className="text-sm font-semibold text-dct-primary mb-4">Topic : {assignment.topic}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">Session Date</p>
          <p className="text-sm font-bold text-dct-dark">{assignment.sessionDate}</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">
            {assignment.submittedOn ? "Submitted On" : "Assignment Due Date"}
          </p>
          <p className="text-sm font-bold text-dct-dark">{assignment.submittedOn || assignment.dueDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <ChipBtn icon={FileText} label={hasFile ? "View Assignment" : "Assignment"} onClick={() => {}} />
        <ChipBtn icon={HelpCircle} label="Ask a Question" onClick={() => {}} />
      </div>

      <Button fullWidth variant="primary" onClick={onSubmit}>Submit Assignment</Button>
    </motion.div>
  );
}

// ─── Feedback Card ──────────────────────────────────────────
function FeedbackCard({ feedback, onView, index }) {
  return (
    <motion.div className="dct-card p-5 sm:p-6"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.07 }}>
      <h3 className="text-base font-bold text-dct-dark mb-0.5">{feedback.title}</h3>
      <p className="text-sm font-semibold text-dct-primary mb-4">Topic : {feedback.topic}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">Session Date</p>
          <p className="text-sm font-bold text-dct-dark">{feedback.sessionDate}</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">Submitted On</p>
          <p className="text-sm font-bold text-dct-dark">{feedback.submittedOn}</p>
        </div>
      </div>

      <ChipBtn icon={FileText} label="Assignment" onClick={() => {}} />
      <div className="mt-3">
        <Button fullWidth variant="primary" onClick={() => onView(feedback)}>View Assignment Feedback</Button>
      </div>
    </motion.div>
  );
}

// ─── Right Panel ────────────────────────────────────────────
function RightPanel() {
  const [referOpen, setReferOpen] = useState(false);
  return (
    <div className="space-y-4">
      <CalendarWidget />
      <AttendanceWidget />
      <CompletionWidget pct={70} />
      <ReferWidget onGetReward={() => setReferOpen(true)} />
      <ReferralModal isOpen={referOpen} onClose={() => setReferOpen(false)} />
    </div>
  );
}

// ─── All Assignments Page ───────────────────────────────────
export function AllAssignmentsPage() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <AppShell>
      <PageWrapper>
        <HeroBanner onAskQuestion={() => setAskOpen(true)} />
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dct-dark mb-4">Assignments</h2>
            <div className="space-y-4">
              {ALL_ASSIGNMENTS.map((a, i) => (
                <AssignmentCard key={a.id} assignment={a} index={i}
                  onSubmit={() => { setSelectedSession(a.title); setSubmitOpen(true); }} />
              ))}
            </div>
          </div>
          <div className="hidden xl:block w-64 flex-shrink-0 self-start sticky top-6"><RightPanel /></div>
        </div>
        <SubmissionModal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} session={selectedSession} />
      </PageWrapper>
    </AppShell>
  );
}

// ─── Assignment Feedback Page ───────────────────────────────
export function AssignmentFeedbackPage() {
  const [viewFeedback, setViewFeedback] = useState(null);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <AppShell>
      <PageWrapper>
        <HeroBanner onAskQuestion={() => setAskOpen(true)} />
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dct-dark mb-4">Assignment Feedback</h2>
            <div className="space-y-4">
              {ASSIGNMENT_FEEDBACKS.map((f, i) => (
                <FeedbackCard key={f.id} feedback={f} index={i} onView={setViewFeedback} />
              ))}
            </div>
          </div>
          <div className="hidden xl:block w-64 flex-shrink-0 self-start sticky top-6"><RightPanel /></div>
        </div>
        <ViewFeedbackModal isOpen={!!viewFeedback} onClose={() => setViewFeedback(null)} feedback={viewFeedback} />
      </PageWrapper>
    </AppShell>
  );
}
