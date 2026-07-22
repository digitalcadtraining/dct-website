import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import StudentProgressTable from "./StudentProgressTable.jsx";
import {
  Modal,
  Textarea,
  Button,
  PageWrapper,
} from "../../components/ui/index.jsx";
import { assignmentApi, batchApi } from "../../services/api.js";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  MessageCircle,
  RefreshCw,
  Star,
  UserCheck,
  Users,
} from "lucide-react";

function formatIst(value) {
  if (!value) return "No submission yet";

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

function getInitial(name = "") {
  return (
    String(name || "S")
      .trim()
      .charAt(0)
      .toUpperCase() || "S"
  );
}

function ProgressBar({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all ${
          safeValue === 100
            ? "bg-green-500"
            : safeValue < 40
              ? "bg-red-500"
              : safeValue < 75
                ? "bg-amber-500"
                : "bg-dct-primary"
        }`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-dct-gray">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-dct-dark">{value}</p>
          {helper && <p className="mt-1 text-[11px] text-dct-gray">{helper}</p>}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-dct-primary">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    SUBMITTED: "bg-green-50 text-green-700 border-green-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}

function FeedbackModal({ studentProgress, batchId, onClose, onSaved }) {
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!studentProgress) return;

    setRating(studentProgress.rating || null);
    setFeedback(studentProgress.feedback || "");
    setErr("");
  }, [studentProgress]);

  if (!studentProgress) return null;

  const save = async () => {
    setSaving(true);
    setErr("");

    try {
      await assignmentApi.saveStudentProgressFeedback(
        batchId,
        studentProgress.student.id,
        {
          rating,
          feedback,
        },
      );

      await onSaved();
      onClose();
    } catch (error) {
      setErr(error.message || "Could not save student feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(studentProgress)}
      onClose={onClose}
      title="Student Assignment Feedback"
    >
      <div className="space-y-5">
        <div className="rounded-2xl border bg-gray-50 p-4">
          <p className="font-extrabold text-dct-dark">
            {studentProgress.student?.name}
          </p>

          <p className="mt-1 text-xs text-dct-gray">
            {studentProgress.submitted}/{studentProgress.total_assignments}{" "}
            assignments submitted
          </p>

          <div className="mt-3">
            <ProgressBar value={studentProgress.completion_percent} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-dct-dark">
            Overall submission rating
          </p>

          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= Number(rating || 0);

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                    active
                      ? "border-amber-300 bg-amber-50 text-amber-500"
                      : "border-gray-200 bg-white text-gray-300 hover:border-amber-200"
                  }`}
                  aria-label={`${value} star rating`}
                >
                  <Star size={20} fill={active ? "currentColor" : "none"} />
                </button>
              );
            })}

            {rating && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="px-3 text-xs font-semibold text-dct-gray"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <Textarea
          label="Overall feedback"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={6}
          maxLength={3000}
          placeholder="Example: Submission consistency is good. Please complete pending sessions and improve draft-analysis documentation."
        />

        <p className="text-right text-[11px] text-dct-gray">
          {feedback.length}/3000
        </p>

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {err}
          </div>
        )}

        <Button fullWidth onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Feedback"}
        </Button>
      </div>
    </Modal>
  );
}

function StudentCard({ item, expanded, onToggle, onFeedback }) {
  const needsAttention = item.overdue > 0 || item.submitted === 0;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white ${
        needsAttention ? "border-red-100" : "border-gray-100"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 font-extrabold text-dct-primary">
              {getInitial(item.student?.name)}
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-extrabold text-dct-dark">
                {item.student?.name || "Student"}
              </h3>

              <p className="truncate text-xs text-dct-gray">
                {item.student?.email}
              </p>
            </div>
          </div>

          {item.submitted === 0 ? (
            <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
              NEVER SUBMITTED
            </span>
          ) : item.overdue > 0 ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
              NEEDS ATTENTION
            </span>
          ) : item.completion_percent === 100 ? (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
              COMPLETE
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
              ON TRACK
            </span>
          )}
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-extrabold text-dct-dark">
              {item.submitted}
              <span className="text-sm font-semibold text-dct-gray">
                /{item.total_assignments}
              </span>
            </p>

            <p className="text-xs text-dct-gray">Assignments submitted</p>
          </div>

          <p className="text-sm font-extrabold text-dct-primary">
            {item.completion_percent}%
          </p>
        </div>

        <div className="mt-3">
          <ProgressBar value={item.completion_percent} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-green-50 p-3 text-center">
            <p className="font-extrabold text-green-700">{item.submitted}</p>
            <p className="text-[10px] font-semibold text-green-700">
              Submitted
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="font-extrabold text-dct-dark">{item.pending}</p>
            <p className="text-[10px] font-semibold text-dct-gray">Pending</p>
          </div>

          <div className="rounded-xl bg-red-50 p-3 text-center">
            <p className="font-extrabold text-red-700">{item.overdue}</p>
            <p className="text-[10px] font-semibold text-red-700">Overdue</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase text-dct-gray">
              Last submission
            </p>

            <p className="mt-1 text-xs font-semibold text-dct-dark">
              {formatIst(item.last_submission_at)}
            </p>
          </div>

          {item.rating ? (
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-bold">{item.rating}/5</span>
            </div>
          ) : (
            <span className="text-[11px] text-dct-gray">No rating</span>
          )}
        </div>

        {item.feedback && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-[10px] font-bold uppercase text-dct-primary">
              Latest Feedback
            </p>

            <p className="mt-1 line-clamp-2 text-xs text-dct-dark">
              {item.feedback}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold text-dct-dark hover:bg-gray-50"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide Progress" : "View Progress"}
          </button>

          <button
            type="button"
            onClick={onFeedback}
            className="flex items-center justify-center gap-2 rounded-xl bg-dct-primary py-2.5 text-xs font-bold text-white"
          >
            <MessageCircle size={14} />
            {item.feedback ? "Update Feedback" : "Give Feedback"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-gray-50 p-4">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-dct-gray">
            Session-wise assignment progress
          </p>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {item.assignments.map((assignment) => (
              <div
                key={assignment.assignment_id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-dct-dark">
                    {assignment.session_number
                      ? `Session ${assignment.session_number}`
                      : "Assignment"}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-dct-gray">
                    {assignment.session_name}
                  </p>

                  {assignment.submitted_at && (
                    <p className="mt-1 text-[10px] text-green-700">
                      Submitted: {formatIst(assignment.submitted_at)}
                    </p>
                  )}
                </div>

                <StatusBadge status={assignment.status} />
              </div>
            ))}

            {item.assignments.length === 0 && (
              <div className="rounded-xl border bg-white p-5 text-center">
                <p className="text-xs font-semibold text-dct-gray">
                  No completed-session assignments are available yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function TutorAssignments() {
  const [viewMode, setViewMode] = useState("TABLE");
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [progressData, setProgressData] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState("");
  const [feedbackStudent, setFeedbackStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    batchApi
      .mine()
      .then((response) => {
        if (!mounted) return;

        const list = response.data || [];

        setBatches(list);

        if (list[0]) {
          setBatchId(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!mounted) return;

        setErr(error.message || "Could not load batches.");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const load = async () => {
    if (!batchId) return;

    setLoading(true);
    setErr("");

    try {
      const response = await assignmentApi.tutorProgress(batchId);
      setProgressData(response.data || null);
    } catch (error) {
      setErr(error.message || "Failed to load student progress.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!batchId) return;

    setExpandedStudentId("");
    setFeedbackStudent(null);
    load();
  }, [batchId]);

  const students = progressData?.students || [];
  const summary = progressData?.summary || {};

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === batchId) || null,
    [batches, batchId],
  );

  const selectedFeedbackStudent = useMemo(() => {
    if (!feedbackStudent) return null;

    return (
      students.find(
        (item) => item.student?.id === feedbackStudent.student?.id,
      ) || feedbackStudent
    );
  }, [students, feedbackStudent]);

  return (
    <AppShell>
      <PageWrapper>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">
              Student Assignment Progress
            </h1>

            <p className="mt-1 text-sm text-dct-gray">
              Track student-wise submissions and provide overall feedback after
              checking assignments in Google Drive.
            </p>

            <p className="mt-1 text-xs font-semibold text-dct-primary">
              Students needing attention are automatically shown first.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading || !batchId}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {batches.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <select
              className="dct-input w-full max-w-md"
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>

            <div className="inline-flex w-fit rounded-xl border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  viewMode === "TABLE"
                    ? "bg-dct-primary text-white"
                    : "text-dct-gray hover:bg-gray-50"
                }`}
              >
                List View
              </button>

              <button
                type="button"
                onClick={() => setViewMode("CARDS")}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  viewMode === "CARDS"
                    ? "bg-dct-primary text-white"
                    : "text-dct-gray hover:bg-gray-50"
                }`}
              >
                Card View
              </button>
            </div>
          </div>
        )}

        {err && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {err}
          </div>
        )}

        {!loading && batches.length === 0 && (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <Users className="mx-auto mb-3 text-gray-300" />

            <p className="font-bold text-dct-dark">No batches assigned</p>

            <p className="mt-1 text-sm text-dct-gray">
              Your batches will appear here after they are assigned.
            </p>
          </div>
        )}

        {batches.length > 0 && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <SummaryCard
                icon={Users}
                label="Students"
                value={summary.students ?? 0}
                helper="Enrolled in batch"
              />

              <SummaryCard
                icon={CheckCircle2}
                label="Average Submission"
                value={`${summary.average_submission ?? 0}%`}
                helper="Across all students"
              />

              <SummaryCard
                icon={UserCheck}
                label="100% Complete"
                value={summary.completed_students ?? 0}
                helper="All assignments submitted"
              />

              <SummaryCard
                icon={AlertCircle}
                label="Need Attention"
                value={summary.need_attention ?? 0}
                helper="Overdue or no submission"
              />

              <SummaryCard
                icon={Clock3}
                label="Never Submitted"
                value={summary.never_submitted ?? 0}
                helper="Immediate follow-up"
              />
            </div>

            {loading ? (
              <div className="rounded-2xl border bg-white p-12 text-center">
                <RefreshCw className="mx-auto mb-3 animate-spin text-dct-primary" />

                <p className="text-sm font-semibold text-dct-gray">
                  Loading student progress...
                </p>
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-2xl border bg-white p-12 text-center">
                <Users className="mx-auto mb-3 text-gray-300" />

                <p className="font-bold text-dct-dark">
                  No students found in this batch
                </p>

                <p className="mt-1 text-sm text-dct-gray">
                  Students will appear here after enrollment.
                </p>
              </div>
            ) : viewMode === "TABLE" ? (
              <StudentProgressTable
                students={students}
                batchName={
                  selectedBatch?.name || progressData?.batch?.name || ""
                }
                onFeedback={(item) => setFeedbackStudent(item)}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {students.map((item) => (
                  <StudentCard
                    key={item.enrollment_id}
                    item={item}
                    expanded={expandedStudentId === item.student?.id}
                    onToggle={() =>
                      setExpandedStudentId((current) =>
                        current === item.student?.id ? "" : item.student?.id,
                      )
                    }
                    onFeedback={() => setFeedbackStudent(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <FeedbackModal
          studentProgress={selectedFeedbackStudent}
          batchId={batchId}
          onClose={() => setFeedbackStudent(null)}
          onSaved={load}
        />
      </PageWrapper>
    </AppShell>
  );
}
