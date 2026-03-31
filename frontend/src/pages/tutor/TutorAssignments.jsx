import { useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { TUTOR_STUDENT_ASSIGNMENTS, SESSION_LIST_NAMES } from "../../constants/dummyData.js";
import { Modal, Input, Textarea, Button, Avatar, PageWrapper } from "../../components/ui/index.jsx";
import { Filter, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";

function FeedbackModal({ isOpen, onClose, assignment }) {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("unchecked");
  if (!assignment) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Feedback" maxWidth="max-w-xl">
      <div className="space-y-4">
        <Input label="Student Name" value={assignment.studentName} readOnly />
        <Input label="Assignment Name" value={assignment.assignmentName} readOnly />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Session Name</label>
          <div className="dct-input bg-gray-50 cursor-default">
            <p className="font-semibold text-dct-dark text-sm">{assignment.sessionName}</p>
            <p className="text-xs text-dct-primary">{assignment.sessionTopic}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Assignment File</label>
          <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-dct-primary" />
              <span className="text-sm font-medium text-dct-dark">{assignment.fileName}</span>
            </div>
            <button className="flex items-center gap-1.5 bg-dct-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-dct-blue transition-colors">
              <Download size={12} /> Download File
            </button>
          </div>
        </div>
        <Textarea label="Give Your Feedback" placeholder="Write your feedback" value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Assignment Checking Status</label>
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={status === "checked"} onChange={() => setStatus("checked")} className="w-4 h-4 rounded accent-dct-primary" />
              <span className="text-sm font-medium text-dct-dark">Checked</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={status === "unchecked"} onChange={() => setStatus("unchecked")} className="w-4 h-4 rounded accent-dct-primary" />
              <span className="text-sm font-medium text-dct-dark">Unchecked</span>
            </label>
          </div>
        </div>
        <Button onClick={onClose} variant="primary" size="md">Submit Feedback</Button>
      </div>
    </Modal>
  );
}

function AssignmentCard({ assignment, onView, index }) {
  return (
    <motion.div className="dct-card p-5"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={assignment.studentName} color="bg-dct-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-dct-dark">{assignment.studentName}</p>
          <p className="text-xs text-dct-lightgray">{assignment.batch}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-dct-lightgray">{assignment.date}</p>
          <span className="status-badge-unchecked"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {assignment.status}</span>
        </div>
      </div>

      <h3 className="text-base font-bold text-dct-dark mb-0.5">{assignment.title}</h3>
      <p className="text-sm font-semibold text-dct-primary mb-4">Topic : {assignment.topic}</p>

      <div className="border border-gray-100 rounded-xl p-3 mb-2 bg-gray-50/50">
        <p className="text-xs text-dct-lightgray font-semibold mb-0.5">Assignment Name</p>
        <p className="text-sm font-bold text-dct-dark">{assignment.assignmentName}</p>
      </div>
      <div className="border border-gray-100 rounded-xl p-3 mb-4 bg-gray-50/50">
        <p className="text-xs text-dct-lightgray font-semibold mb-1">Assignment File</p>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-dct-primary" />
          <span className="text-sm font-medium text-dct-dark">{assignment.fileName}</span>
        </div>
      </div>

      <Button fullWidth variant="primary" onClick={() => onView(assignment)}>View Assignment</Button>
    </motion.div>
  );
}

export default function TutorAssignments() {
  const [selected, setSelected] = useState(null);
  const [filterSession, setFilterSession] = useState("");

  return (
    <AppShell>
      <PageWrapper>
        <h2 className="text-xl font-bold text-dct-dark mb-5">Assignments</h2>

        {/* Filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <select className="dct-input appearance-none pr-8 text-dct-lightgray cursor-pointer"
              value={filterSession} onChange={e => setFilterSession(e.target.value)}>
              <option value="">Enter a Session Name</option>
              {SESSION_LIST_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dct-lightgray pointer-events-none">▾</span>
          </div>
          <button className="flex items-center gap-2 bg-dct-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-dct-blue transition-colors">
            <Filter size={14} /> Apply Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TUTOR_STUDENT_ASSIGNMENTS.map((a, i) => (
            <AssignmentCard key={a.id} assignment={a} index={i} onView={setSelected} />
          ))}
        </div>

        <FeedbackModal isOpen={!!selected} onClose={() => setSelected(null)} assignment={selected} />
      </PageWrapper>
    </AppShell>
  );
}
