import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import {
  Modal,
  Input,
  Textarea,
  Button,
  PageWrapper,
} from "../../components/ui/index.jsx";
import {
  assignmentApi,
  batchApi,
  sessionApi,
} from "../../services/api.js";
import {
  Plus,
  Upload,
  FileText,
  Download,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Lock,
} from "lucide-react";

function formatIst(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

function defaultDueForSession(sessions, sessionId) {
  if (!sessions?.length) return "";

  const ordered = [...sessions].sort(
    (a, b) => (a.session_number || 0) - (b.session_number || 0),
  );
  const current = ordered.find((session) => session.id === sessionId);
  let base = null;

  if (current) {
    const next = ordered.find(
      (session) =>
        (session.session_number || 0) >
          (current.session_number || 0) && session.scheduled_at,
    );
    base = next?.scheduled_at || current.scheduled_at;
  }

  if (!base) base = ordered.find((session) => session.scheduled_at)?.scheduled_at;
  if (!base) return "";

  const date = new Date(base);
  date.setTime(date.getTime() - 2 * 60 * 60 * 1000);
  return toDateTimeLocal(date);
}

function CreateModal({
  open,
  onClose,
  batchId,
  sessions,
  onCreated,
  initialSession,
}) {
  const selectedSession = sessions.find(
    (session) => session.id === initialSession,
  );
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    session_id: initialSession || "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm((current) => ({
        ...current,
        session_id: initialSession || "",
        due_date:
          defaultDueForSession(sessions, initialSession) ||
          current.due_date,
      }));
    }
  }, [open, initialSession, sessions]);

  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setErr("");
    if (!batchId) return setErr("Select a batch first.");
    if (!form.title.trim())
      return setErr("Assignment title is required.");

    setLoading(true);
    try {
      await assignmentApi.create(
        { batch_id: batchId, ...form },
        file,
      );
      await onCreated();
      onClose();
      setForm({
        title: "",
        description: "",
        due_date: defaultDueForSession(
          sessions,
          initialSession,
        ),
        session_id: initialSession || "",
      });
      setFile(null);
    } catch (e) {
      setErr(e.message || "Failed to create assignment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Upload Assignment"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <Input
          label="Assignment Title"
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="e.g. Door Trim Attachment Design"
        />

        {initialSession ? (
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold uppercase text-blue-500">
              Default Session
            </p>
            <p className="text-sm font-bold text-dct-dark">
              Session {selectedSession?.session_number}:{" "}
              {selectedSession?.name || "Selected session"}
            </p>
            <p className="text-xs text-dct-gray mt-1">
              Assignment will be linked to this session automatically.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-dct-dark mb-1.5">
              Session
            </label>
            <select
              className="dct-input"
              value={form.session_id}
              onChange={(event) => {
                set("session_id", event.target.value);
                set(
                  "due_date",
                  defaultDueForSession(
                    sessions,
                    event.target.value,
                  ),
                );
              }}
            >
              <option value="">Batch level assignment</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  Session {session.session_number}: {session.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Due Date & Time (IST)"
          type="datetime-local"
          value={form.due_date}
          onChange={(event) => set("due_date", event.target.value)}
        />

        <Textarea
          label="Instructions"
          value={form.description}
          onChange={(event) =>
            set("description", event.target.value)
          }
          placeholder="Explain what the student has to submit..."
        />

        <label className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer">
          <Upload size={22} />
          <span className="text-sm text-dct-gray text-center">
            {file
              ? file.name
              : "Upload ZIP, PDF or CAD reference file"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
          />
        </label>

        <p className="text-xs text-dct-gray">
          The file is stored privately. Students download it only through
          their DCT dashboard.
        </p>

        {err && (
          <p className="text-sm text-red-600 font-semibold">{err}</p>
        )}

        <Button fullWidth onClick={submit} disabled={loading}>
          {loading ? "Uploading securely..." : "Create Assignment"}
        </Button>
      </div>
    </Modal>
  );
}

function ReviewModal({ submission, onClose, onSaved }) {
  const [feedback, setFeedback] = useState(
    submission?.feedback || "",
  );
  const [grade, setGrade] = useState(submission?.grade || "");
  const [status, setStatus] = useState(
    submission?.status === "RESUBMIT"
      ? "RESUBMIT"
      : "REVIEWED",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!submission) return;
    setFeedback(submission.feedback || "");
    setGrade(submission.grade || "");
    setStatus(
      submission.status === "RESUBMIT"
        ? "RESUBMIT"
        : "REVIEWED",
    );
  }, [submission]);

  if (!submission) return null;

  const save = async () => {
    setLoading(true);
    try {
      await assignmentApi.reviewSubmission(submission.id, {
        feedback,
        grade,
        status,
      });
      await onSaved();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(submission)}
      onClose={onClose}
      title="Review Submission"
    >
      <div className="space-y-4">
        <Input
          label="Student"
          value={submission.student?.name || ""}
          readOnly
        />
        <Input
          label="Assignment"
          value={submission.assignment?.title || ""}
          readOnly
        />
        <Input
          label="Grade"
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
          placeholder="A / Good / Needs improvement"
        />
        <Textarea
          label="Feedback"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={4}
        />
        <select
          className="dct-input"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="REVIEWED">Reviewed / Accepted</option>
          <option value="RESUBMIT">Need Resubmission</option>
        </select>
        <Button fullWidth onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Submit Feedback"}
        </Button>
      </div>
    </Modal>
  );
}

export default function TutorAssignments() {
  const [params] = useSearchParams();
  const initialBatch = params.get("batch_id") || "";
  const initialSession = params.get("session_id") || "";

  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState(initialBatch);
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [tab, setTab] = useState("assignments");
  const [open, setOpen] = useState(
    Boolean(initialBatch && initialSession),
  );
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadBatches = async () => {
    const response = await batchApi.mine();
    const list = response.data || [];
    setBatches(list);
    if (!batchId && list[0]) setBatchId(list[0].id);
  };

  useEffect(() => {
    loadBatches().catch((e) => setErr(e.message));
  }, []);

  const load = async () => {
    if (!batchId) return;

    setLoading(true);
    setErr("");
    try {
      const [sessionResponse, assignmentResponse, submissionResponse] =
        await Promise.all([
          sessionApi.getForBatch(batchId),
          assignmentApi.getForBatch(batchId),
          assignmentApi.tutorSubmissions(batchId),
        ]);

      setSessions(sessionResponse.data || []);
      setAssignments(assignmentResponse.data || []);
      setSubmissions(submissionResponse.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [batchId]);

  const pending = submissions.filter(
    (submission) => submission.status === "SUBMITTED",
  ).length;

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === initialSession),
    [sessions, initialSession],
  );

  const downloadAssignment = async (assignment) => {
    try {
      await assignmentApi.downloadAssignment(
        assignment.id,
        assignment.original_filename ||
          `${assignment.title || "assignment"}.zip`,
        "tutor",
      );
    } catch (e) {
      alert(e.message || "Could not download assignment.");
    }
  };

  const downloadSubmission = async (submission) => {
    try {
      await assignmentApi.downloadSubmission(
        submission.id,
        submission.original_filename || "student-assignment",
        "tutor",
      );
    } catch (e) {
      alert(e.message || "Could not download submission.");
    }
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">
              Assignments
            </h1>
            <p className="text-sm text-dct-gray">
              Upload tasks and review locked student submissions
            </p>
            <p className="text-xs text-dct-gray mt-1">
              New student files become visible here after their 48-hour
              replacement window closes.
            </p>
            {activeSession && (
              <p className="text-xs text-dct-primary font-bold mt-1">
                Creating for Session {activeSession.session_number}:{" "}
                {activeSession.name}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl border bg-white text-sm font-bold flex items-center gap-2"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-xl bg-dct-primary text-white text-sm font-bold flex items-center gap-2"
            >
              <Plus size={14} />
              Upload Assignment
            </button>
          </div>
        </div>

        {batches.length > 0 && (
          <select
            className="dct-input max-w-md mb-5"
            value={batchId}
            onChange={(event) => setBatchId(event.target.value)}
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        )}

        {err && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
            {err}
          </div>
        )}

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("assignments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              tab === "assignments"
                ? "bg-dct-primary text-white"
                : "bg-gray-100"
            }`}
          >
            Uploaded Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setTab("submissions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              tab === "submissions"
                ? "bg-dct-primary text-white"
                : "bg-gray-100"
            }`}
          >
            Student Submissions ({pending} pending)
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-dct-gray">Loading...</p>
        ) : tab === "assignments" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="dct-card p-5">
                <h3 className="font-extrabold text-dct-dark">
                  {assignment.title}
                </h3>
                <p className="text-sm text-dct-primary mt-1">
                  {assignment.session
                    ? `Session ${assignment.session.session_number}: ${assignment.session.name}`
                    : "Batch assignment"}
                </p>
                <p className="text-xs text-dct-gray my-3 line-clamp-3">
                  {assignment.description || "No instructions"}
                </p>
                <div className="flex justify-between text-xs mb-3">
                  <span>Due: {formatIst(assignment.due_date)}</span>
                  <span>
                    {assignment.submissions?.length || 0} locked submissions
                  </span>
                </div>
                {assignment.has_file && (
                  <button
                    onClick={() => downloadAssignment(assignment)}
                    className="text-xs font-bold text-dct-primary flex items-center gap-1"
                  >
                    <Download size={13} />
                    Download File
                  </button>
                )}
              </div>
            ))}

            {assignments.length === 0 && (
              <div className="col-span-full bg-white border rounded-2xl p-12 text-center">
                <ClipboardList className="mx-auto text-gray-300 mb-3" />
                <p className="font-bold">
                  No assignments uploaded
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="dct-card p-5">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-dct-dark">
                      {submission.student?.name}
                    </p>
                    <p className="text-xs text-dct-gray">
                      {submission.student?.email}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full h-fit ${
                      submission.status === "REVIEWED"
                        ? "bg-green-100 text-green-700"
                        : submission.status === "RESUBMIT"
                          ? "bg-red-100 text-red-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {submission.status === "SUBMITTED"
                      ? "LOCKED"
                      : submission.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm mt-4">
                  {submission.assignment?.title}
                </h3>
                <p className="text-xs text-dct-primary mt-1">
                  {submission.assignment?.session
                    ? `Session ${submission.assignment.session.session_number}`
                    : "Batch assignment"}
                </p>
                <p className="text-xs text-dct-gray my-3">
                  Submitted: {formatIst(submission.submitted_at)}
                </p>
                <p className="text-xs text-purple-700 mb-3 flex items-center gap-1">
                  <Lock size={12} />
                  Student edit window completed
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadSubmission(submission)}
                    className="py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <FileText size={13} />
                    File
                  </button>
                  <button
                    onClick={() => setReview(submission)}
                    className="py-2 rounded-xl bg-dct-primary text-white text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 size={13} />
                    Review
                  </button>
                </div>
              </div>
            ))}

            {submissions.length === 0 && (
              <div className="col-span-full bg-white border rounded-2xl p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-3" />
                <p className="font-bold">
                  No locked student submissions yet
                </p>
              </div>
            )}
          </div>
        )}

        <CreateModal
          open={open}
          onClose={() => setOpen(false)}
          batchId={batchId}
          sessions={sessions}
          initialSession={initialSession}
          onCreated={load}
        />

        <ReviewModal
          submission={review}
          onClose={() => setReview(null)}
          onSaved={load}
        />
      </PageWrapper>
    </AppShell>
  );
}
