import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { Modal, Input, Textarea, Button, Avatar, PageWrapper } from "../../components/ui/index.jsx";
import { Filter, Download, FileText, RefreshCw, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { assignmentApi, batchApi, mediaUrl } from "../../services/api.js";

function fmtDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function FeedbackModal({ isOpen, onClose, submission, onSaved }) {
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("REVIEWED");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setFeedback(submission?.feedback || "");
    setGrade(submission?.grade || "");
    setStatus(submission?.status === "RESUBMIT" ? "RESUBMIT" : "REVIEWED");
  }, [submission]);

  if (!submission) return null;

  const fileUrl = mediaUrl(submission.file_url);

  const submit = async () => {
    setLoading(true);
    setErr("");
    try {
      await assignmentApi.reviewSubmission(submission.id, { grade, feedback, status });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Feedback" maxWidth="max-w-xl">
      <div className="space-y-4">
        <Input label="Student Name" value={submission.student?.name || ""} readOnly />
        <Input label="Assignment Name" value={submission.assignment?.title || ""} readOnly />
        <Input label="Session Name" value={submission.assignment?.session ? `Session ${submission.assignment.session.session_number}: ${submission.assignment.session.name}` : "Batch Assignment"} readOnly />
        <Input label="Grade" value={grade} onChange={e => setGrade(e.target.value)} placeholder="A / B+ / Good / Needs improvement" />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Assignment File</label>
          <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={16} className="text-dct-primary flex-shrink-0" />
              <span className="text-sm font-medium text-dct-dark truncate">{submission.file_url?.split("/").pop() || "Submitted file"}</span>
            </div>
            <button onClick={() => fileUrl && window.open(fileUrl, "_blank")} className="flex items-center gap-1.5 bg-dct-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-dct-blue transition-colors">
              <Download size={12} /> Open
            </button>
          </div>
        </div>
        <Textarea label="Give Your Feedback" placeholder="Write feedback for student..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Checking Status</label>
          <select className="dct-input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="REVIEWED">Reviewed / Accepted</option>
            <option value="RESUBMIT">Need Resubmission</option>
          </select>
        </div>
        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
        <Button onClick={submit} disabled={loading} variant="primary" size="md">{loading ? "Saving..." : "Submit Feedback"}</Button>
      </div>
    </Modal>
  );
}

function AssignmentCard({ submission, onView, index }) {
  const reviewed = submission.status === "REVIEWED";
  const resubmit = submission.status === "RESUBMIT";
  return (
    <motion.div className="dct-card p-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={submission.student?.name || "S"} color="bg-dct-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-dct-dark">{submission.student?.name || "Student"}</p>
          <p className="text-xs text-dct-lightgray">{submission.assignment?.batch?.name || "Batch"}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-dct-lightgray">{fmtDate(submission.submitted_at)}</p>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${reviewed ? "bg-green-100 text-green-700" : resubmit ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
            {reviewed ? "Reviewed" : resubmit ? "Resubmit" : "Unchecked"}
          </span>
        </div>
      </div>

      <h3 className="text-base font-bold text-dct-dark mb-0.5">{submission.assignment?.title || "Assignment"}</h3>
      <p className="text-sm font-semibold text-dct-primary mb-4">
        {submission.assignment?.session ? `Session ${submission.assignment.session.session_number}: ${submission.assignment.session.name}` : "Batch Assignment"}
      </p>

      <div className="border border-gray-100 rounded-xl p-3 mb-4 bg-gray-50/50">
        <p className="text-xs text-dct-lightgray font-semibold mb-1">Assignment File</p>
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-dct-primary" />
          <span className="text-sm font-medium text-dct-dark truncate">{submission.file_url?.split("/").pop() || "Submitted file"}</span>
        </div>
      </div>

      <Button fullWidth variant="primary" onClick={() => onView(submission)}>{reviewed ? "Edit Feedback" : "Check Assignment"}</Button>
    </motion.div>
  );
}

export default function TutorAssignments() {
  const [selected, setSelected] = useState(null);
  const [filterBatch, setFilterBatch] = useState("");
  const [batches, setBatches] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadBatches = async () => {
    const res = await batchApi.mine();
    const list = res.data || [];
    setBatches(list);
    if (!filterBatch && list[0]) setFilterBatch(list[0].id);
    return list;
  };

  const loadSubmissions = async (batchId = filterBatch) => {
    setLoading(true);
    setErr("");
    try {
      const res = await assignmentApi.tutorSubmissions(batchId);
      setSubmissions(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load submissions. Make sure backend replacement files are also added.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches().then(list => {
      if (list[0]) loadSubmissions(list[0].id);
      else setLoading(false);
    }).catch(e => {
      setErr(e.message || "Failed to load batches.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (filterBatch) loadSubmissions(filterBatch);
  }, [filterBatch]);

  const counts = useMemo(() => ({
    total: submissions.length,
    unchecked: submissions.filter(s => s.status === "SUBMITTED").length,
    reviewed: submissions.filter(s => s.status === "REVIEWED").length,
  }), [submissions]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-dct-dark">Assignments</h2>
            <p className="text-sm text-dct-lightgray">{counts.unchecked} unchecked · {counts.reviewed} reviewed · {counts.total} total</p>
          </div>
          <button onClick={() => loadSubmissions()} className="text-sm font-bold text-dct-primary flex items-center gap-1"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Refresh</button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <select className="dct-input appearance-none pr-8 text-dct-gray cursor-pointer" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
              <option value="">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dct-lightgray pointer-events-none">▾</span>
          </div>
          <button onClick={() => loadSubmissions()} className="flex items-center gap-2 bg-dct-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-dct-blue transition-colors">
            <Filter size={14} /> Apply
          </button>
        </div>

        {err && <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">{err}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? [1,2,3,4,5,6].map(i => <div key={i} className="dct-card p-5 h-56 animate-pulse bg-gray-50" />) :
            submissions.map((a, i) => <AssignmentCard key={a.id} submission={a} index={i} onView={setSelected} />)}
        </div>

        {!loading && submissions.length === 0 && !err && (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <ClipboardList size={42} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-dct-dark">No submissions yet</p>
            <p className="text-sm text-dct-lightgray mt-1">Student submissions will appear here after upload.</p>
          </div>
        )}

        <FeedbackModal isOpen={!!selected} onClose={() => setSelected(null)} submission={selected} onSaved={() => loadSubmissions()} />
      </PageWrapper>
    </AppShell>
  );
}
