import { useState, useEffect, useMemo } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";
import {
  batchApi,
  sessionApi,
  queryApi,
  assignmentApi,
  mediaUrl,
} from "../../services/api.js";
import {
  Calendar,
  HelpCircle,
  ChevronRight,
  X,
  Layers,
  Download,
  Upload,
} from "lucide-react";

const C = {
  dark: "#1F1A17",
  navy: "#003C6E",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#9ca3af",
};

function dayStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayEnd(d = new Date()) {
  const x = dayStart(d);
  x.setDate(x.getDate() + 1);
  return x;
}

function parseSlotStart(slot) {
  const first = String(slot || "")
    .split(/[–-]/)[0]
    ?.trim();
  const m = first.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!m) return "";

  let h = Number(m[1]);
  const mm = m[2];
  const ap = m[3]?.toUpperCase();

  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;

  return `${String(h).padStart(2, "0")}:${mm}`;
}

function displaySlotStart(slot) {
  const t = parseSlotStart(slot);
  if (!t) return "TBD";

  const [h, m] = t.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`;
}

function deriveStatus(session) {
  if (!session.scheduled_at) {
    return session.status || "UPCOMING";
  }

  const now = new Date();
  const date = new Date(session.scheduled_at);
  const todayStart = dayStart(now);
  const todayEnd = dayEnd(now);

  if (date < todayStart) return "COMPLETED";

  if (date >= todayStart && date < todayEnd) {
    return date <= now ? "LIVE" : "TODAY";
  }

  return session.status || "UPCOMING";
}

function fmtDate(iso) {
  return iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "TBD";
}

function fmtDay(iso) {
  if (!iso) return "";

  const d = dayStart(iso);
  const t = dayStart();
  const tm = dayEnd();

  if (d.getTime() === t.getTime()) return "Today";
  if (d.getTime() === tm.getTime()) return "Tomorrow";

  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function fmtTime(iso, fallback) {
  if (!iso) return displaySlotStart(fallback);

  const d = new Date(iso);

  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) {
    return displaySlotStart(fallback);
  }

  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function AskQueryModal({ session, batchId, onClose }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) {
      return setErr("Please enter your question.");
    }

    setLoading(true);
    setErr("");

    try {
      await queryApi.create({
        batch_id: batchId,
        session_id: session.id,
        question: question.trim(),
      });
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to submit query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.5)",
          backdropFilter: "blur(4px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 420,
          padding: 28,
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          zIndex: 10,
        }}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: C.dark,
            }}
          >
            Ask a Question
          </h3>

          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "none",
              background: "#f3f4f6",
              cursor: "pointer",
            }}
          >
            <X size={14} style={{ color: C.gray }} />
          </button>
        </div>

        <div
          style={{
            background: "#eff8ff",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: C.blue,
            fontWeight: 600,
          }}
        >
          Session {session.session_number}: {session.name}
        </div>

        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 700,
            color: C.gray,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: ".5px",
          }}
        >
          Your Question
        </label>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Describe your question in detail…"
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 12,
            fontSize: 14,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: 4,
            boxSizing: "border-box",
          }}
        />

        {err && (
          <p
            style={{
              fontSize: 12,
              color: "#dc2626",
              marginBottom: 8,
            }}
          >
            {err}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 0",
            background: `linear-gradient(135deg,${C.blue},${C.primary})`,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
            marginTop: 8,
          }}
        >
          {loading ? "Submitting…" : "Submit Question"}
        </button>
      </motion.div>
    </div>
  );
}

function SubmitAssignmentModal({ session, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!file) {
      setErr("Please select your assignment file.");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const response = await assignmentApi.submitForSession(session.id, file);

      alert(response?.message || "Assignment submitted successfully.");

      await onUploaded();
      onClose();
    } catch (error) {
      setErr(error.message || "Could not upload assignment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.5)",
          backdropFilter: "blur(4px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={loading ? undefined : onClose}
      />

      <motion.div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          padding: 28,
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
          zIndex: 10,
        }}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: C.dark,
            }}
          >
            Submit Assignment
          </h3>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              border: "none",
              background: "#f3f4f6",
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div
          style={{
            background: "#eff8ff",
            color: C.blue,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Session {session.session_number}: {session.name}
        </div>

        <p
          style={{
            fontSize: 12,
            color: C.gray,
            marginBottom: 14,
          }}
        >
          Upload the practical work completed in this session. You can replace
          the submitted file for 48 hours.
        </p>

        <label
          style={{
            border: "2px dashed #dbe3ea",
            borderRadius: 14,
            padding: "28px 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          <Upload size={24} color={C.primary} />

          <span
            style={{
              fontSize: 13,
              color: file ? C.dark : C.gray,
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {file
              ? file.name
              : "Select CATPart, CATProduct, STEP, PRT, ZIP, RAR or another CAD file"}
          </span>

          <input
            type="file"
            hidden
            onChange={(event) => {
              setErr("");
              setFile(event.target.files?.[0] || null);
            }}
          />
        </label>

        {err && (
          <p
            style={{
              color: "#dc2626",
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            {err}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 0",
            background: `linear-gradient(135deg,${C.blue},${C.primary})`,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Uploading securely…" : "Upload Assignment"}
        </button>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }) {
  const MAP = {
    LIVE: {
      bg: "#dcfce7",
      color: "#16a34a",
      dot: "#22c55e",
      label: "Live Now",
      pulse: true,
    },
    TODAY: {
      bg: "#fff7ed",
      color: "#ea580c",
      dot: "#f97316",
      label: "Today",
    },
    UPCOMING: {
      bg: "#eff8ff",
      color: C.primary,
      dot: C.primary,
      label: "Upcoming",
    },
    COMPLETED: {
      bg: "#f5f3ff",
      color: "#7c3aed",
      dot: "#8b5cf6",
      label: "Completed",
    },
    CANCELLED: {
      bg: "#fef2f2",
      color: "#dc2626",
      dot: "#ef4444",
      label: "Cancelled",
    },
  };

  const s = MAP[status] || MAP.UPCOMING;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          display: "inline-block",
          animation: s.pulse ? "pulseDot 1.5s infinite" : "none",
        }}
      />
      {s.label}
    </span>
  );
}

function AssignmentArea({ session, isCompleted, onSubmit }) {
  const assignments = session.assignments || [];

  if (!isCompleted) {
    return (
      <div
        style={{
          border: "1px dashed #e5e7eb",
          borderRadius: 10,
          padding: "9px 11px",
          fontSize: 11,
          color: C.lg,
          marginBottom: 10,
        }}
      >
        Assignment submission opens after this session is completed.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      {assignments.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              style={{
                border: "1px solid #c3ebff",
                background: "#F0F7FF",
                borderRadius: 10,
                padding: "9px 11px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.dark,
                    }}
                  >
                    {assignment.title}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: C.gray,
                    }}
                  >
                    Ready for your submission
                  </p>
                </div>

                {assignment.file_url && (
                  <button
                    onClick={() =>
                      window.open(mediaUrl(assignment.file_url), "_blank")
                    }
                    style={{
                      border: "none",
                      background: C.primary,
                      color: "#fff",
                      borderRadius: 8,
                      padding: "7px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Download size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onSubmit(session)}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 10,
          padding: "11px 12px",
          color: "#fff",
          background: `linear-gradient(135deg,${C.blue},${C.primary})`,
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
        }}
      >
        <Upload size={14} />
        Submit Assignment
      </button>
    </div>
  );
}

function SessionCard({
  session,
  timeSlots,
  onAskQuestion,
  onSubmitAssignment,
  index,
}) {
  const status = session._derivedStatus || deriveStatus(session);
  const isComp = status === "COMPLETED";
  const isLive = status === "LIVE";
  const sessionTime = fmtTime(session.scheduled_at, timeSlots?.[0]);
  const joinUrl = session.zoom_link || session.recording_url || "";

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{
        boxShadow: "0 2px 16px rgba(0,0,0,.06)",
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.06, 0.4),
      }}
    >
      {isLive && (
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#22c55e,#16a34a)",
          }}
        />
      )}

      <div style={{ padding: "18px 20px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.dark,
                lineHeight: 1.35,
                marginBottom: 3,
              }}
            >
              Session {session.session_number}
            </h3>

            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.name || "Topic TBD"}
            </p>
          </div>

          <StatusBadge status={status} />
        </div>
      </div>

      <div style={{ padding: "14px 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              border: "1px solid #e8ecf0",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: C.lg,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".5px",
                marginBottom: 3,
              }}
            >
              Date
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.dark,
              }}
            >
              {fmtDate(session.scheduled_at)}
            </p>
            <p
              style={{
                fontSize: 10,
                color: isLive ? "#16a34a" : C.primary,
                fontWeight: 600,
                marginTop: 1,
              }}
            >
              {fmtDay(session.scheduled_at)}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #e8ecf0",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: C.lg,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".5px",
                marginBottom: 3,
              }}
            >
              Time
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.dark,
              }}
            >
              {sessionTime}
            </p>
          </div>
        </div>

        <AssignmentArea
          session={session}
          isCompleted={isComp}
          onSubmit={onSubmitAssignment}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <button
            onClick={() => onAskQuestion(session)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 11px",
              background: "#F0F7FF",
              border: "1px solid #c3ebff",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: C.primary,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <HelpCircle size={12} />
              Ask Query
            </span>
            <ChevronRight size={12} />
          </button>
        </div>

        {joinUrl ? (
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "11px 0",
              background: isComp
                ? "linear-gradient(135deg,#7c3aed,#8b5cf6)"
                : `linear-gradient(135deg,${C.blue},${C.primary})`,
              color: "#fff",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            {isComp
              ? "▶ View Recording"
              : isLive
                ? "⚡ Join Live Session"
                : "Go to Session"}
          </a>
        ) : (
          <button
            disabled
            style={{
              width: "100%",
              padding: "11px 0",
              background: "#e5e7eb",
              color: C.gray,
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "not-allowed",
              fontFamily: "inherit",
            }}
          >
            {isComp ? "Recording Not Added Yet" : "Zoom Link Not Added Yet"}
          </button>
        )}
      </div>

      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </motion.div>
  );
}

function BatchSelectorCard({ batch, selected, onClick }) {
  const isSel = selected?.id === batch.id;
  const now = dayStart();
  const start = batch.start_date ? dayStart(batch.start_date) : null;
  const end = batch.end_date ? dayStart(batch.end_date) : null;

  let batchStatus = "Upcoming";

  if (start && end) {
    if (now >= start && now <= end) {
      batchStatus = "Active";
    } else if (now > end) {
      batchStatus = "Completed";
    }
  }

  const startStr = start
    ? start.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        minWidth: 190,
        padding: "14px 16px",
        borderRadius: 16,
        border: isSel ? `2px solid ${C.primary}` : "2px solid #e5e7eb",
        background: isSel ? "linear-gradient(135deg,#eff8ff,#dbeafe)" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all .2s",
        boxShadow: isSel
          ? "0 4px 18px rgba(0,123,191,.15)"
          : "0 1px 4px rgba(0,0,0,.05)",
        position: "relative",
      }}
    >
      {isSel && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: C.primary,
          }}
        />
      )}

      <span
        style={{
          display: "inline-block",
          fontSize: 9,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 999,
          background: isSel ? C.primary : "#f3f4f6",
          color: isSel ? "#fff" : C.gray,
          marginBottom: 8,
          letterSpacing: ".5px",
          textTransform: "uppercase",
        }}
      >
        {batchStatus}
      </span>

      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: isSel ? C.blue : C.dark,
          lineHeight: 1.35,
          marginBottom: 4,
        }}
      >
        {batch.name || batch.course?.name || "Batch"}
      </p>

      <p
        style={{
          fontSize: 11,
          color: C.lg,
          marginBottom: 4,
        }}
      >
        {batch.course?.name || ""}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Calendar size={10} style={{ color: C.lg }} />
        <span
          style={{
            fontSize: 10,
            color: C.lg,
            fontWeight: 500,
          }}
        >
          From {startStr}
        </span>
      </div>
    </button>
  );
}

function useBatchSessions() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    batchApi
      .enrolled()
      .then((res) => {
        const list = (res.data || []).map((e) => e.batch).filter(Boolean);

        setBatches(list);

        if (list.length > 0) {
          setSelectedBatch(list[0]);
        }
      })
      .catch((e) => setError(e.message || "Failed to load batches."))
      .finally(() => setLoadingBatches(false));
  }, []);

  const loadSessions = async () => {
    if (!selectedBatch) return;

    setLoadingSessions(true);

    try {
      const res = await sessionApi.getForBatch(selectedBatch.id);
      setSessions(res.data || []);
    } catch (e) {
      setError(e.message || "Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    setSessions([]);
    loadSessions();
  }, [selectedBatch]);

  const enriched = useMemo(
    () =>
      sessions.map((s) => ({
        ...s,
        _derivedStatus: deriveStatus(s),
      })),
    [sessions],
  );

  return {
    batches,
    selectedBatch,
    setSelectedBatch,
    enriched,
    loadingBatches,
    loadingSessions,
    error,
    loadSessions,
  };
}

function BatchSelector({ batches, selectedBatch, setSelectedBatch }) {
  if (batches.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.lg,
          textTransform: "uppercase",
          letterSpacing: ".8px",
          marginBottom: 10,
        }}
      >
        Select Batch
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {batches.map((batch) => (
          <BatchSelectorCard
            key={batch.id}
            batch={batch}
            selected={selectedBatch}
            onClick={() => setSelectedBatch(batch)}
          />
        ))}
      </div>
    </div>
  );
}

function SessionsPage({
  defaultFilter = "ALL",
  title = "My Sessions",
  subtitle = "Track all your learning sessions across batches",
}) {
  const {
    batches,
    selectedBatch,
    setSelectedBatch,
    enriched,
    loadingBatches,
    loadingSessions,
    error,
    loadSessions,
  } = useBatchSessions();

  const [filter, setFilter] = useState(defaultFilter);
  const [askSession, setAskSession] = useState(null);
  const [submitSession, setSubmitSession] = useState(null);

  const completedCount = enriched.filter(
    (s) => s._derivedStatus === "COMPLETED",
  ).length;

  const todayCount = enriched.filter(
    (s) => s._derivedStatus === "TODAY" || s._derivedStatus === "LIVE",
  ).length;

  const upcomingCount = enriched.filter(
    (s) => s._derivedStatus === "UPCOMING",
  ).length;

  const progressPct =
    enriched.length > 0
      ? Math.round((completedCount / enriched.length) * 100)
      : 0;

  const filtered = useMemo(() => {
    if (filter === "TODAY") {
      return enriched.filter(
        (s) => s._derivedStatus === "TODAY" || s._derivedStatus === "LIVE",
      );
    }

    if (filter === "UPCOMING") {
      return enriched.filter((s) => s._derivedStatus === "UPCOMING");
    }

    if (filter === "COMPLETED") {
      return enriched.filter((s) => s._derivedStatus === "COMPLETED");
    }

    return enriched;
  }, [enriched, filter]);

  const FILTERS = [
    {
      key: "ALL",
      label: "All",
      count: enriched.length,
    },
    {
      key: "TODAY",
      label: "Today",
      count: todayCount,
    },
    {
      key: "UPCOMING",
      label: "Upcoming",
      count: upcomingCount,
    },
    {
      key: "COMPLETED",
      label: "Completed",
      count: completedCount,
    },
  ];

  return (
    <AppShell>
      <PageWrapper>
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.dark,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: C.lg,
              marginTop: 2,
            }}
          >
            {subtitle}
          </p>
        </div>

        {loadingBatches && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  width: 190,
                  height: 92,
                  borderRadius: 16,
                  background: "#f3f4f6",
                }}
              />
            ))}
          </div>
        )}

        <BatchSelector
          batches={batches}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
        />

        {selectedBatch && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #eef2f6",
              borderRadius: 16,
              padding: 18,
              marginBottom: 18,
              boxShadow: "0 2px 10px rgba(0,0,0,.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                }}
              >
                Progress
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: C.primary,
                }}
              >
                {progressPct}%
              </p>
            </div>

            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#eef2f6",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg,${C.blue},${C.primary})`,
                }}
              />
            </div>

            <p
              style={{
                fontSize: 11,
                color: C.lg,
                marginTop: 7,
              }}
            >
              {completedCount} of {enriched.length} sessions completed
            </p>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 800,
                background:
                  filter === item.key
                    ? `linear-gradient(135deg,${C.blue},${C.primary})`
                    : "#f3f4f6",
                color: filter === item.key ? "#fff" : C.gray,
                cursor: "pointer",
              }}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        {!loadingBatches && batches.length === 0 && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Layers className="mx-auto text-gray-300 mb-3" size={38} />
            <p className="font-bold text-dct-dark">No enrolled batches found</p>
          </div>
        )}

        {loadingSessions && (
          <p className="text-sm text-dct-gray">Loading sessions...</p>
        )}

        {!loadingSessions && selectedBatch && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Calendar className="mx-auto text-gray-300 mb-3" size={38} />
            <p className="font-bold text-dct-dark">
              No sessions in this filter
            </p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: 16,
          }}
        >
          {filtered.map((session, index) => (
            <SessionCard
              key={session.id}
              session={session}
              timeSlots={selectedBatch?.time_slots || []}
              onAskQuestion={setAskSession}
              onSubmitAssignment={setSubmitSession}
              index={index}
            />
          ))}
        </div>

        {askSession && (
          <AskQueryModal
            session={askSession}
            batchId={selectedBatch?.id}
            onClose={() => setAskSession(null)}
          />
        )}

        {submitSession && (
          <SubmitAssignmentModal
            session={submitSession}
            onClose={() => setSubmitSession(null)}
            onUploaded={loadSessions}
          />
        )}
      </PageWrapper>
    </AppShell>
  );
}

export function AllSessionsPage() {
  return <SessionsPage defaultFilter="ALL" title="My Sessions" />;
}

export function UpcomingSessionsPage() {
  return (
    <SessionsPage
      defaultFilter="UPCOMING"
      title="Upcoming Sessions"
      subtitle="Upcoming live learning sessions"
    />
  );
}

export function CompletedSessionsPage() {
  return (
    <SessionsPage
      defaultFilter="COMPLETED"
      title="Completed Sessions"
      subtitle="Completed classes and recordings"
    />
  );
}
