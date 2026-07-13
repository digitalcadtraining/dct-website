import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import {
  Modal,
  Input,
  Textarea,
  Button,
  PageWrapper,
} from "../../components/ui/index.jsx";
import { assignmentApi, batchApi } from "../../services/api.js";
import {
  Download,
  RefreshCw,
  CheckCircle2,
  Lock,
  ClipboardCheck,
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

function ReviewModal({ submission, onClose, onSaved }) {
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("REVIEWED");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!submission) return;

    setFeedback(submission.feedback || "");
    setGrade(submission.grade || "");
    setStatus(submission.status === "RESUBMIT" ? "RESUBMIT" : "REVIEWED");
    setErr("");
  }, [submission]);

  if (!submission) return null;

  const save = async () => {
    setLoading(true);
    setErr("");

    try {
      await assignmentApi.reviewSubmission(submission.id, {
        feedback,
        grade,
        status,
      });

      await onSaved();
      onClose();
    } catch (error) {
      setErr(error.message || "Could not save feedback.");
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

        {err && <p className="text-sm text-red-600">{err}</p>}

        <Button fullWidth onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Submit Feedback"}
        </Button>
      </div>
    </Modal>
  );
}

export default function TutorAssignments() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    batchApi
      .mine()
      .then((response) => {
        const list = response.data || [];
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
      const response = await assignmentApi.tutorSubmissions(batchId);

      setSubmissions(response.data || []);
    } catch (error) {
      setErr(error.message || "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [batchId]);

  const downloadSubmission = async (submission) => {
    try {
      await assignmentApi.downloadSubmission(
        submission.id,
        submission.original_filename || "student-assignment",
        "tutor",
      );
    } catch (error) {
      alert(error.message || "Could not download submission.");
    }
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">
              Student Assignments
            </h1>
            <p className="text-sm text-dct-gray">
              Review final submissions after each student's 48-hour replacement
              window closes.
            </p>
            <p className="text-xs text-dct-primary font-semibold mt-1">
              Submission tasks open automatically when a live session is marked
              completed. Tutors no longer need to create or upload assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-xl border bg-white text-sm font-bold flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
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

        {loading ? (
          <p className="text-sm text-dct-gray">Loading...</p>
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
                          : submission.is_locked
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {submission.status === "REVIEWED"
                      ? "REVIEWED"
                      : submission.status === "RESUBMIT"
                        ? "RESUBMIT"
                        : submission.is_locked
                          ? "LOCKED"
                          : "EDIT WINDOW ACTIVE"}
                  </span>
                </div>

                <h3 className="font-bold text-sm mt-4">
                  {submission.assignment?.title}
                </h3>

                <p className="text-xs text-dct-primary mt-1">
                  {submission.assignment?.session
                    ? `Session ${submission.assignment.session.session_number}: ${submission.assignment.session.name}`
                    : "Session assignment"}
                </p>

                <p className="text-xs text-dct-gray my-3">
                  Submitted: {formatIst(submission.submitted_at)}
                </p>

                {submission.is_locked ? (
                  <p className="text-xs text-purple-700 mb-3 flex items-center gap-1">
                    <Lock size={12} />
                    Replacement window completed. Ready for review.
                  </p>
                ) : (
                  <p className="text-xs text-blue-700 mb-3">
                    Student can replace this file until{" "}
                    {formatIst(submission.editable_until)}.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSubmission(submission)}
                    className="py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Download size={13} />
                    Download
                  </button>

                  <button
                    type="button"
                    disabled={!submission.is_locked}
                    onClick={() => {
                      if (submission.is_locked) {
                        setReview(submission);
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${
                      submission.is_locked
                        ? "bg-dct-primary text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    {submission.is_locked ? "Review" : "Review after 48h"}
                  </button>
                </div>
              </div>
            ))}

            {submissions.length === 0 && (
              <div className="col-span-full bg-white border rounded-2xl p-12 text-center">
                <ClipboardCheck className="mx-auto text-gray-300 mb-3" />
                <p className="font-bold">No locked submissions yet</p>
                <p className="text-sm text-dct-gray mt-1">
                  Student files appear here after their 48-hour replacement
                  window closes.
                </p>
              </div>
            )}
          </div>
        )}

        <ReviewModal
          submission={review}
          onClose={() => setReview(null)}
          onSaved={load}
        />
      </PageWrapper>
    </AppShell>
  );
}
