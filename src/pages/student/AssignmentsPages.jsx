import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import HeroBanner from "../../components/shared/HeroBanner.jsx";
import { CalendarWidget, AttendanceWidget, CompletionWidget, ReferWidget } from "../../components/shared/widgets.jsx";
import { Modal, Input, Textarea, Button, ChipBtn, PageWrapper } from "../../components/ui/index.jsx";
import { FileText, HelpCircle, Upload, X, RefreshCw, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import ReferralModal from "../../components/shared/ReferralModal.jsx";
import { assignmentApi, batchApi, mediaUrl, queryApi } from "../../services/api.js";

function fmtDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function getSubmission(a) {
  return a.submissions?.[0] || null;
}

function SubmissionModal({ isOpen, onClose, assignment, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!assignment) return null;

  const submit = async () => {
    if (!file) return setErr("Please select your assignment file.");
    setLoading(true);
    setErr("");
    try {
      await assignmentApi.submit(assignment.id, file);
      onSubmitted();
      onClose();
      setFile(null);
    } catch(e) {
      setErr(e.message || "Failed to submit assignment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Submission">
      <div className="space-y-4">
        <Input label="Assignment Name" value={assignment.title || ""} readOnly />
        <Input label="Session Name" value={assignment.session ? `Session ${assignment.session.session_number}: ${assignment.session.name}` : "Batch Assignment"} readOnly />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Upload File</label>
          {file && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-2">
              <span className="text-sm font-semibold text-dct-primary truncate">{file.name}</span>
              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <span className="text-xs text-dct-gray">{Math.round(file.size / 1024)} KB</span>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
              </div>
            </div>
          )}
          <label className="border-2 border-dashed border-gray-200 hover:border-dct-primary rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors group">
            <Upload size={22} className="text-gray-300 group-hover:text-dct-primary transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-dct-primary transition-colors">Click to select CATPart/PDF/ZIP file</span>
            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
        <Button onClick={submit} disabled={loading} variant="primary" size="md">{loading ? "Submitting..." : "Submit Assignment"}</Button>
      </div>
    </Modal>
  );
}

function AskQuestionModal({ isOpen, onClose, assignment, batchId }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!assignment) return null;

  const submit = async () => {
    if (!question.trim()) return setErr("Please write your question.");
    setLoading(true);
    setErr("");
    try {
      await queryApi.create({
        batch_id: batchId,
        session_id: assignment.session_id || undefined,
        question: question.trim(),
      });
      setQuestion("");
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to submit query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask Assignment Question">
      <div className="space-y-4">
        <Input label="Assignment" value={assignment.title || ""} readOnly />
        <Textarea label="Your Question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Explain your doubt clearly..." rows={5} />
        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
        <Button onClick={submit} disabled={loading} variant="primary">{loading ? "Submitting..." : "Submit Question"}</Button>
      </div>
    </Modal>
  );
}

function ViewFeedbackModal({ isOpen, onClose, assignment }) {
  const sub = assignment ? getSubmission(assignment) : null;
  if (!assignment || !sub) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Feedback">
      <div className="space-y-4">
        <Input label="Assignment Name" value={assignment.title || ""} readOnly />
        <Input label="Session Name" value={assignment.session ? `Session ${assignment.session.session_number}: ${assignment.session.name}` : "Batch Assignment"} readOnly />
        <Input label="Grade" value={sub.grade || "Not graded yet"} readOnly />
        <Input label="Status" value={sub.status || "SUBMITTED"} readOnly />
        <div>
          <label className="block text-sm font-semibold text-dct-dark mb-1.5">Tutor Feedback</label>
          <div className="dct-input bg-blue-50/50 text-dct-primary text-sm leading-relaxed min-h-[80px] py-3">
            {sub.feedback || "Feedback not added yet."}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AssignmentCard({ assignment, onSubmit, onFeedback, onAsk, index }) {
  const sub = getSubmission(assignment);
  const fileUrl = mediaUrl(assignment.file_url);
  const reviewed = sub?.status === "REVIEWED";
  const submitted = !!sub;

  return (
    <motion.div className="dct-card p-5 sm:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.07 }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-bold text-dct-dark mb-0.5">{assignment.title}</h3>
          <p className="text-sm font-semibold text-dct-primary">
            {assignment.session ? `Session ${assignment.session.session_number}: ${assignment.session.name}` : "Batch Assignment"}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${reviewed ? "bg-green-100 text-green-700" : submitted ? "bg-blue-100 text-dct-primary" : "bg-orange-100 text-orange-700"}`}>
          {reviewed ? "Reviewed" : submitted ? "Submitted" : "Pending"}
        </span>
      </div>

      {assignment.description && <p className="text-sm text-dct-gray leading-relaxed mb-4">{assignment.description}</p>}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">Due Date</p>
          <p className="text-sm font-bold text-dct-dark">{fmtDate(assignment.due_date)}</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <p className="text-[10px] text-dct-lightgray font-semibold uppercase tracking-wide mb-0.5">Submitted On</p>
          <p className="text-sm font-bold text-dct-dark">{fmtDate(sub?.submitted_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <ChipBtn icon={FileText} label="Assignment File" onClick={() => fileUrl ? window.open(fileUrl, "_blank") : null} />
        <ChipBtn icon={HelpCircle} label="Ask Question" onClick={onAsk} />
      </div>

      {reviewed ? (
        <Button fullWidth variant="primary" onClick={onFeedback}>View Feedback</Button>
      ) : (
        <Button fullWidth variant={submitted ? "outline" : "primary"} onClick={onSubmit}>{submitted ? "Resubmit Assignment" : "Submit Assignment"}</Button>
      )}
    </motion.div>
  );
}

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

function useStudentAssignments() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadBatches = async () => {
    const res = await batchApi.enrolled();
    const list = (res.data || []).map(e => e.batch).filter(Boolean);
    setBatches(list);
    if (!batchId && list[0]) setBatchId(list[0].id);
    return list;
  };

  const loadAssignments = async (id = batchId) => {
    if (!id) return;
    setLoading(true);
    setErr("");
    try {
      const res = await assignmentApi.getForBatch(id);
      setAssignments(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches().catch(e => {
      setErr(e.message || "Failed to load batches.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (batchId) loadAssignments(batchId);
  }, [batchId]);

  return { batches, batchId, setBatchId, assignments, loading, err, reload: () => loadAssignments(batchId) };
}

function BatchSelect({ batches, batchId, setBatchId }) {
  if (batches.length <= 1) return null;
  return (
    <div className="mb-5">
      <select value={batchId} onChange={e => setBatchId(e.target.value)} className="dct-input max-w-md">
        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </div>
  );
}

export function AllAssignmentsPage() {
  const { batches, batchId, setBatchId, assignments, loading, err, reload } = useStudentAssignments();
  const [submitAssignment, setSubmitAssignment] = useState(null);
  const [askAssignment, setAskAssignment] = useState(null);

  return (
    <AppShell>
      <PageWrapper>
        <HeroBanner onAskQuestion={() => assignments[0] && setAskAssignment(assignments[0])} />
        <BatchSelect batches={batches} batchId={batchId} setBatchId={setBatchId} />

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-dct-dark">Assignments</h2>
              <button onClick={reload} className="text-sm font-bold text-dct-primary flex items-center gap-1"><RefreshCw size={14}/> Refresh</button>
            </div>

            {err && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 mb-4">{err}</div>}

            <div className="space-y-4">
              {loading ? [1,2,3].map(i => <div key={i} className="dct-card p-6 h-48 animate-pulse bg-gray-50" />) :
                assignments.map((a, i) => (
                  <AssignmentCard key={a.id} assignment={a} index={i} onSubmit={() => setSubmitAssignment(a)} onAsk={() => setAskAssignment(a)} onFeedback={() => {}} />
                ))}
            </div>

            {!loading && assignments.length === 0 && !err && (
              <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
                <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-dct-dark">No assignments yet</p>
                <p className="text-sm text-dct-lightgray mt-1">Your tutor has not uploaded assignments for this batch.</p>
              </div>
            )}
          </div>
          <div className="hidden xl:block w-64 flex-shrink-0 self-start sticky top-6"><RightPanel /></div>
        </div>

        <SubmissionModal isOpen={!!submitAssignment} onClose={() => setSubmitAssignment(null)} assignment={submitAssignment} onSubmitted={reload} />
        <AskQuestionModal isOpen={!!askAssignment} onClose={() => setAskAssignment(null)} assignment={askAssignment} batchId={batchId} />
      </PageWrapper>
    </AppShell>
  );
}

export function AssignmentFeedbackPage() {
  const { batches, batchId, setBatchId, assignments, loading, err, reload } = useStudentAssignments();
  const [viewFeedback, setViewFeedback] = useState(null);

  const reviewed = useMemo(() => assignments.filter(a => getSubmission(a)?.status === "REVIEWED" || getSubmission(a)?.feedback), [assignments]);

  return (
    <AppShell>
      <PageWrapper>
        <HeroBanner />
        <BatchSelect batches={batches} batchId={batchId} setBatchId={setBatchId} />

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-dct-dark">Assignment Feedback</h2>
              <button onClick={reload} className="text-sm font-bold text-dct-primary flex items-center gap-1"><RefreshCw size={14}/> Refresh</button>
            </div>

            {err && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 mb-4">{err}</div>}

            <div className="space-y-4">
              {loading ? [1,2].map(i => <div key={i} className="dct-card p-6 h-44 animate-pulse bg-gray-50" />) :
                reviewed.map((a, i) => (
                  <AssignmentCard key={a.id} assignment={a} index={i} onFeedback={() => setViewFeedback(a)} onSubmit={() => {}} onAsk={() => {}} />
                ))}
            </div>

            {!loading && reviewed.length === 0 && !err && (
              <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
                <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-dct-dark">No feedback yet</p>
                <p className="text-sm text-dct-lightgray mt-1">Reviewed assignment feedback will appear here.</p>
              </div>
            )}
          </div>
          <div className="hidden xl:block w-64 flex-shrink-0 self-start sticky top-6"><RightPanel /></div>
        </div>

        <ViewFeedbackModal isOpen={!!viewFeedback} onClose={() => setViewFeedback(null)} assignment={viewFeedback} />
      </PageWrapper>
    </AppShell>
  );
}
