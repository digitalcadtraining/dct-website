import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import HeroBanner from "../../components/shared/HeroBanner.jsx";
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
  queryApi,
} from "../../services/api.js";
import {
  FileText,
  HelpCircle,
  Upload,
  RefreshCw,
  BookOpen,
  Lock,
  Clock3,
  CheckCircle2,
} from "lucide-react";

const subOf = (assignment) =>
  assignment?.submissions?.[0] || null;

function formatIst(value, withTime = false) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      : {}),
  });
}

function replacementMessage(submission) {
  if (!submission) return "";

  if (submission.status === "RESUBMIT") {
    return "Tutor requested a corrected file. Upload your revised submission.";
  }

  if (submission.can_replace && submission.editable_until) {
    return `You can replace this file until ${formatIst(
      submission.editable_until,
      true,
    )} IST.`;
  }

  if (
    submission.is_locked &&
    submission.status !== "REVIEWED"
  ) {
    return "Your 48-hour edit window is complete. The submission is locked and available to your tutor.";
  }

  return "";
}

function SubmitModal({
  assignment,
  onClose,
  onDone,
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!assignment) return null;

  const submission = subOf(assignment);

  const submit = async () => {
    if (!file) {
      setErr("Select your CAD or ZIP file first.");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const result = await assignmentApi.submit(
        assignment.id,
        file,
      );

      await onDone();
      onClose();
      alert(
        result?.message ||
          "Assignment submitted successfully.",
      );
    } catch (error) {
      setErr(
        error.message ||
          "Could not submit the assignment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(assignment)}
      onClose={onClose}
      title={
        submission
          ? "Replace Assignment File"
          : "Submit Assignment"
      }
    >
      <div className="space-y-4">
        <Input
          label="Session Assignment"
          value={assignment.title}
          readOnly
        />

        {submission && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {replacementMessage(submission)}
          </div>
        )}

        <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer">
          <Upload size={22} />
          <span className="text-sm text-dct-gray text-center">
            {file
              ? file.name
              : "Select CATPart, CATProduct, PRT, STEP, ZIP, RAR or another CAD file"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(event) => {
              setErr("");
              setFile(
                event.target.files?.[0] || null,
              );
            }}
          />
        </label>

        {err && (
          <p className="text-sm text-red-600">{err}</p>
        )}

        <Button
          fullWidth
          onClick={submit}
          disabled={loading}
        >
          {loading
            ? "Uploading securely..."
            : "Upload Submission"}
        </Button>
      </div>
    </Modal>
  );
}

function AskModal({
  assignment,
  batchId,
  onClose,
}) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!assignment) return null;

  const submit = async () => {
    if (!question.trim()) {
      setErr("Write your question.");
      return;
    }

    setLoading(true);

    try {
      await queryApi.create({
        batch_id: batchId,
        session_id:
          assignment.session_id || undefined,
        question: question.trim(),
      });
      onClose();
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(assignment)}
      onClose={onClose}
      title="Ask Doubt"
    >
      <div className="space-y-4">
        <Input
          label="Session Assignment"
          value={assignment.title}
          readOnly
        />
        <Textarea
          label="Question"
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          rows={5}
        />
        {err && (
          <p className="text-red-600 text-sm">
            {err}
          </p>
        )}
        <Button
          fullWidth
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Sending..." : "Ask Tutor"}
        </Button>
      </div>
    </Modal>
  );
}

function useAssignments() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    batchApi
      .enrolled()
      .then((response) => {
        const list = (response.data || [])
          .map((enrollment) => enrollment.batch)
          .filter(Boolean);

        setBatches(list);

        if (list[0]) {
          setBatchId(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        setErr(error.message);
        setLoading(false);
      });
  }, []);

  const load = async () => {
    if (!batchId) return;

    setLoading(true);
    setErr("");

    try {
      const response =
        await assignmentApi.getForBatch(batchId);

      setAssignments(response.data || []);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [batchId]);

  return {
    batches,
    batchId,
    setBatchId,
    assignments,
    loading,
    err,
    load,
  };
}

function AssignmentCard({
  assignment,
  onSubmit,
  onAsk,
  onFeedback,
}) {
  const submission = subOf(assignment);
  const reviewed =
    submission?.status === "REVIEWED";
  const resubmit =
    submission?.status === "RESUBMIT";
  const awaitingReview =
    submission?.is_locked &&
    !reviewed &&
    !resubmit;

  let badge = "Open";
  let badgeClass =
    "bg-orange-100 text-orange-700";

  if (reviewed) {
    badge = "Reviewed";
    badgeClass =
      "bg-green-100 text-green-700";
  } else if (resubmit) {
    badge = "Correction Needed";
    badgeClass =
      "bg-red-100 text-red-700";
  } else if (awaitingReview) {
    badge = "Locked";
    badgeClass =
      "bg-purple-100 text-purple-700";
  } else if (submission) {
    badge = "Submitted";
    badgeClass =
      "bg-blue-100 text-dct-primary";
  }

  return (
    <div className="dct-card p-5">
      <div className="flex justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-dct-dark">
            {assignment.title}
          </h3>
          <p className="text-sm text-dct-primary mt-1">
            {assignment.session
              ? `Session ${assignment.session.session_number}: ${assignment.session.name}`
              : "Session assignment"}
          </p>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full h-fit ${badgeClass}`}
        >
          {badge}
        </span>
      </div>

      <p className="text-sm text-dct-gray my-3">
        {assignment.description ||
          "Submit the practical work completed in this live session."}
      </p>

      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Reference ZIP/files and detailed instructions are
        shared in the official WhatsApp group.
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div className="border rounded-xl p-3">
          <p className="font-bold">Session Status</p>
          <p>Completed</p>
        </div>
        <div className="border rounded-xl p-3">
          <p className="font-bold">Submitted</p>
          <p>
            {formatIst(
              submission?.submitted_at,
              true,
            )}
          </p>
        </div>
      </div>

      {submission &&
        replacementMessage(submission) && (
          <div
            className={`mb-3 rounded-xl border p-3 text-xs ${
              awaitingReview
                ? "border-purple-200 bg-purple-50 text-purple-800"
                : resubmit
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <div className="flex gap-2">
              {awaitingReview ? (
                <Lock
                  size={14}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <Clock3
                  size={14}
                  className="mt-0.5 shrink-0"
                />
              )}

              <span>
                {replacementMessage(submission)}
              </span>
            </div>
          </div>
        )}

      <button
        type="button"
        onClick={onAsk}
        className="w-full mb-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1"
      >
        <HelpCircle size={13} />
        Ask Tutor
      </button>

      {reviewed ? (
        <Button
          fullWidth
          onClick={onFeedback}
        >
          View Feedback
        </Button>
      ) : submission?.can_replace ? (
        <Button
          fullWidth
          onClick={onSubmit}
        >
          {resubmit
            ? "Upload Corrected File"
            : "Replace Submission"}
        </Button>
      ) : submission ? (
        <button
          type="button"
          disabled
          className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-bold flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          Locked — Awaiting Tutor Review
        </button>
      ) : (
        <Button
          fullWidth
          onClick={onSubmit}
        >
          Submit Assignment
        </Button>
      )}
    </div>
  );
}

export function AllAssignmentsPage() {
  const state = useAssignments();
  const [
    submitAssignment,
    setSubmitAssignment,
  ] = useState(null);
  const [askAssignment, setAskAssignment] =
    useState(null);
  const [
    feedbackAssignment,
    setFeedbackAssignment,
  ] = useState(null);

  return (
    <AppShell>
      <PageWrapper>
        <HeroBanner />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold">
              Assignments
            </h2>
            <p className="text-xs text-dct-gray mt-1">
              A submission task opens automatically
              after each live session is completed.
              You can replace your file for 48 hours.
            </p>
          </div>

          <button
            type="button"
            onClick={state.load}
            className="text-sm font-bold text-dct-primary flex gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {state.batches.length > 1 && (
          <select
            className="dct-input max-w-md mb-5"
            value={state.batchId}
            onChange={(event) =>
              state.setBatchId(event.target.value)
            }
          >
            {state.batches.map((batch) => (
              <option
                key={batch.id}
                value={batch.id}
              >
                {batch.name}
              </option>
            ))}
          </select>
        )}

        {state.err && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4">
            {state.err}
          </div>
        )}

        {state.loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.assignments.map(
              (assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onSubmit={() =>
                    setSubmitAssignment(
                      assignment,
                    )
                  }
                  onAsk={() =>
                    setAskAssignment(assignment)
                  }
                  onFeedback={() =>
                    setFeedbackAssignment(
                      assignment,
                    )
                  }
                />
              ),
            )}
          </div>
        )}

        {!state.loading &&
          state.assignments.length === 0 && (
            <div className="bg-white border rounded-2xl p-12 text-center">
              <BookOpen className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold">
                No assignments are open yet
              </p>
              <p className="text-sm text-dct-gray mt-1">
                An assignment will appear
                automatically after a live session is
                marked completed.
              </p>
            </div>
          )}

        <SubmitModal
          assignment={submitAssignment}
          onClose={() =>
            setSubmitAssignment(null)
          }
          onDone={state.load}
        />

        <AskModal
          assignment={askAssignment}
          batchId={state.batchId}
          onClose={() =>
            setAskAssignment(null)
          }
        />

        <Modal
          isOpen={Boolean(
            feedbackAssignment,
          )}
          onClose={() =>
            setFeedbackAssignment(null)
          }
          title="Feedback"
        >
          <div className="space-y-3">
            <Input
              label="Grade"
              value={
                subOf(feedbackAssignment)
                  ?.grade || "Not graded"
              }
              readOnly
            />
            <Textarea
              label="Tutor Feedback"
              value={
                subOf(feedbackAssignment)
                  ?.feedback || "No feedback"
              }
              readOnly
              rows={5}
            />
          </div>
        </Modal>
      </PageWrapper>
    </AppShell>
  );
}

export function AssignmentFeedbackPage() {
  const state = useAssignments();
  const [
    feedbackAssignment,
    setFeedbackAssignment,
  ] = useState(null);

  const reviewed = useMemo(
    () =>
      state.assignments.filter(
        (assignment) =>
          subOf(assignment)?.status ===
            "REVIEWED" ||
          subOf(assignment)?.feedback,
      ),
    [state.assignments],
  );

  return (
    <AppShell>
      <PageWrapper>
        <HeroBanner />

        <h2 className="text-xl font-bold mb-4">
          Assignment Feedback
        </h2>

        {state.loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reviewed.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onFeedback={() =>
                  setFeedbackAssignment(
                    assignment,
                  )
                }
                onSubmit={() => {}}
                onAsk={() => {}}
              />
            ))}
          </div>
        )}

        {!state.loading &&
          reviewed.length === 0 && (
            <div className="bg-white border rounded-2xl p-12 text-center">
              <FileText className="mx-auto text-gray-300 mb-3" />
              <p className="font-bold">
                No feedback yet
              </p>
            </div>
          )}

        <Modal
          isOpen={Boolean(
            feedbackAssignment,
          )}
          onClose={() =>
            setFeedbackAssignment(null)
          }
          title="Feedback"
        >
          <div className="space-y-3">
            <Input
              label="Grade"
              value={
                subOf(feedbackAssignment)
                  ?.grade || "Not graded"
              }
              readOnly
            />
            <Textarea
              label="Tutor Feedback"
              value={
                subOf(feedbackAssignment)
                  ?.feedback || "No feedback"
              }
              readOnly
              rows={5}
            />
          </div>
        </Modal>
      </PageWrapper>
    </AppShell>
  );
}
