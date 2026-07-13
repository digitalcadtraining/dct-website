import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BookOpen,
  Pencil,
  Save,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi, api } from "../../services/api.js";

const C = {
  dark: "#1F1A17",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#7E7F81",
};

const STATUS_STYLE = {
  PENDING_APPROVAL: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    label: "Pending Approval",
  },
  UPCOMING: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Upcoming",
  },
  ACTIVE: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Active",
  },
  COMPLETED: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    label: "Completed",
  },
};

function rupee(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function toLocalInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}T${get(
    "hour",
  )}:${get("minute")}`;
}

function indiaLocalToISO(value) {
  if (!value) return null;

  const [datePart, timePart] = String(value).split("T");
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (
    ![year, month, day, hour, minute].every(Number.isFinite)
  ) {
    return null;
  }

  const utcMs = Date.UTC(
    year,
    month - 1,
    day,
    hour - 5,
    minute - 30,
    0,
    0,
  );

  return new Date(utcMs).toISOString();
}

function offerLabel(batch) {
  const start = batch.offer_start_at
    ? new Date(batch.offer_start_at)
    : null;

  const end = batch.offer_end_at
    ? new Date(batch.offer_end_at)
    : null;

  const now = new Date();

  if (start && now < start) return "Scheduled";
  if (end && now <= end) return "Live";
  if (start || end) return "Expired";
  return "No timer";
}

function ToggleField({ checked, label, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm font-bold">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_APPROVAL");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const load = () => {
    setLoading(true);

    Promise.all([
      adminApi.batches(),
      api.get("/prerequisites/admin/catalog", "admin"),
    ])
      .then(([batchResponse, catalogResponse]) => {
        setBatches(batchResponse.data || []);
        setCatalog(catalogResponse.data || []);
      })
      .catch((error) => {
        setErrorMessage(
          error.message || "Could not load batch settings.",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminApi.approveBatch(id);

      setBatches((items) =>
        items.map((batch) =>
          batch.id === id
            ? { ...batch, status: "UPCOMING" }
            : batch,
        ),
      );

      alert("✅ Batch approved! Students can now enroll.");
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this batch?")) return;

    try {
      await adminApi.rejectBatch(id);

      setBatches((items) =>
        items.filter((batch) => batch.id !== id),
      );
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const startEdit = async (batch) => {
    setErrorMessage("");

    try {
      const response = await api.get(
        `/prerequisites/admin/batches/${batch.id}/access`,
        "admin",
      );

      const access = response.data || {};

      setEditing({
        id: batch.id,
        name: batch.name,
        offer_name:
          batch.offer_name || "Limited Batch Offer",
        original_price:
          batch.original_price ||
          batch.course?.price ||
          "",
        offer_price:
          batch.offer_price ||
          batch.course?.price ||
          "",
        offer_start_at: toLocalInput(
          batch.offer_start_at,
        ),
        offer_end_at: toLocalInput(
          batch.offer_end_at,
        ),
        start_date: toLocalInput(
          access.start_date || batch.start_date,
        ),
        end_date: toLocalInput(
          access.end_date || batch.end_date,
        ),
        max_students:
          access.max_students ||
          batch.max_students ||
          50,
        time_slots: Array.isArray(
          access.time_slots || batch.time_slots,
        )
          ? (access.time_slots || batch.time_slots).join(
              "\n",
            )
          : "",
        show_prerequisites:
          access.show_prerequisites !== false,
        show_sessions:
          access.show_sessions !== false,
        show_assignments:
          access.show_assignments !== false,
        show_progress:
          access.show_progress !== false,
        visible_prerequisite_ids: Array.isArray(
          access.visible_prerequisite_ids,
        )
          ? access.visible_prerequisite_ids
          : [],
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Could not open batch settings.",
      );
    }
  };

  const saveSettings = async () => {
    if (!editing?.id) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const pricingResponse = await api.patch(
        `/admin/batches/${editing.id}/pricing`,
        {
          offer_name: editing.offer_name,
          original_price: editing.original_price,
          offer_price: editing.offer_price,
          offer_start_at: indiaLocalToISO(
            editing.offer_start_at,
          ),
          offer_end_at: indiaLocalToISO(
            editing.offer_end_at,
          ),
        },
        "admin",
      );

      const accessResponse = await api.patch(
        `/prerequisites/admin/batches/${editing.id}/access`,
        {
          start_date: indiaLocalToISO(
            editing.start_date,
          ),
          end_date: indiaLocalToISO(
            editing.end_date,
          ),
          max_students: Number(
            editing.max_students,
          ),
          time_slots: String(
            editing.time_slots || "",
          )
            .split(/\n|,/)
            .map((slot) => slot.trim())
            .filter(Boolean),
          show_prerequisites:
            editing.show_prerequisites,
          show_sessions: editing.show_sessions,
          show_assignments:
            editing.show_assignments,
          show_progress: editing.show_progress,
          visible_prerequisite_ids:
            editing.show_prerequisites
              ? editing.visible_prerequisite_ids
              : [],
        },
        "admin",
      );

      const updated = {
        ...(pricingResponse.data || {}),
        ...(accessResponse.data || {}),
      };

      setBatches((items) =>
        items.map((batch) =>
          batch.id === editing.id
            ? { ...batch, ...updated }
            : batch,
        ),
      );

      setEditing(null);

      alert(
        "✅ Batch dates, offer and student access updated.",
      );
    } catch (error) {
      setErrorMessage(
        error.message || "Could not save batch settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const filtered =
    filter === "ALL"
      ? batches
      : batches.filter(
          (batch) => batch.status === filter,
        );

  const pendingCount = batches.filter(
    (batch) =>
      batch.status === "PENDING_APPROVAL",
  ).length;

  return (
    <AppShell>
      <PageWrapper>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="mb-1 text-2xl font-extrabold"
              style={{ color: C.dark }}
            >
              Batch Management
            </h1>

            <p
              className="text-sm"
              style={{ color: C.gray }}
            >
              {pendingCount > 0 && (
                <span className="font-bold text-yellow-600">
                  {pendingCount} pending approval ·{" "}
                </span>
              )}

              {batches.length} total batches
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {[
            "PENDING_APPROVAL",
            "ALL",
            "UPCOMING",
            "ACTIVE",
            "COMPLETED",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition-all"
              style={{
                background:
                  filter === item
                    ? `linear-gradient(135deg,${C.blue},${C.primary})`
                    : "#f3f4f6",
                color:
                  filter === item
                    ? "white"
                    : C.gray,
              }}
            >
              {item === "PENDING_APPROVAL"
                ? `Pending (${pendingCount})`
                : item}
            </button>
          ))}
        </div>

        {loading && (
          <p
            className="py-12 text-center text-sm"
            style={{ color: C.gray }}
          >
            Loading batches…
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
            <CheckCircle2
              size={40}
              className="mx-auto mb-3"
              style={{ color: "#22c55e" }}
            />
            <p
              className="font-bold"
              style={{ color: C.dark }}
            >
              No batches here
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((batch, index) => {
            const status =
              STATUS_STYLE[batch.status] ||
              STATUS_STYLE.UPCOMING;

            const slots = batch.time_slots || [];

            const original =
              batch.original_price ||
              batch.course?.price ||
              0;

            const offer =
              batch.offer_price ||
              batch.course?.price ||
              0;

            const timer = offerLabel(batch);

            return (
              <motion.div
                key={batch.id}
                className="rounded-2xl border border-gray-100 bg-white p-5"
                style={{
                  boxShadow:
                    "0 2px 12px rgba(0,0,0,0.05)",
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.05,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.bg} ${status.text}`}
                      >
                        {status.label}
                      </span>

                      <h3
                        className="text-sm font-extrabold"
                        style={{ color: C.dark }}
                      >
                        {batch.name}
                      </h3>
                    </div>

                    <p
                      className="mb-2 text-xs"
                      style={{ color: C.gray }}
                    >
                      Tutor:{" "}
                      <strong
                        style={{ color: C.dark }}
                      >
                        {batch.tutor?.name}
                      </strong>
                      {" · "}
                      Course:{" "}
                      <strong
                        style={{ color: C.dark }}
                      >
                        {batch.course?.name}
                      </strong>
                    </p>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold"
                        style={{ color: C.gray }}
                      >
                        📅{" "}
                        {new Date(
                          batch.start_date,
                        ).toLocaleDateString("en-IN")}{" "}
                        →{" "}
                        {new Date(
                          batch.end_date,
                        ).toLocaleDateString("en-IN")}
                      </span>

                      <span
                        className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold"
                        style={{ color: C.gray }}
                      >
                        <Users
                          size={10}
                          className="mr-1 inline"
                        />
                        {batch._count?.enrollments ||
                          0}
                        /{batch.max_students} students
                      </span>

                      <span
                        className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold"
                        style={{ color: C.gray }}
                      >
                        <BookOpen
                          size={10}
                          className="mr-1 inline"
                        />
                        {batch._count
                          ?.scheduled_sessions || 0}{" "}
                        sessions
                      </span>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold"
                        style={{ color: C.blue }}
                      >
                        Offer:{" "}
                        {batch.offer_name ||
                          "Limited Batch Offer"}
                      </span>

                      <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                        Price ₹{rupee(offer)}
                      </span>

                      {Number(original) >
                        Number(offer) && (
                        <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                          Original ₹
                          {rupee(original)}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          timer === "Live"
                            ? "bg-orange-50 text-orange-700"
                            : timer === "Scheduled"
                              ? "bg-sky-50 text-sky-700"
                              : timer === "Expired"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        Timer: {timer}
                      </span>
                    </div>

                    {slots.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((slot) => (
                          <span
                            key={slot}
                            className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold"
                            style={{
                              color: C.primary,
                            }}
                          >
                            <Clock size={10} />
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 flex-col gap-2">
                    <button
                      onClick={() =>
                        startEdit(batch)
                      }
                      className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all hover:bg-blue-50"
                      style={{
                        borderColor: "#bfdbfe",
                        color: C.blue,
                      }}
                    >
                      <Pencil size={13} />
                      Edit Batch
                    </button>

                    {batch.status ===
                      "PENDING_APPROVAL" && (
                      <>
                        <button
                          onClick={() =>
                            handleApprove(batch.id)
                          }
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                          style={{
                            background:
                              "linear-gradient(135deg,#16a34a,#22c55e)",
                          }}
                        >
                          <CheckCircle2 size={13} />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleReject(batch.id)
                          }
                          className="flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all hover:bg-red-50"
                          style={{
                            borderColor: "#fca5a5",
                            color: "#dc2626",
                          }}
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <h2
                className="mb-1 text-xl font-extrabold"
                style={{ color: C.dark }}
              >
                Edit Batch & Student Access
              </h2>

              <p
                className="mb-5 text-xs"
                style={{ color: C.gray }}
              >
                {editing.name}
              </p>

              <div className="space-y-5">
                <section>
                  <h3
                    className="mb-3 text-sm font-extrabold"
                    style={{ color: C.dark }}
                  >
                    Batch Offer
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: C.gray }}
                      >
                        Offer Name
                      </label>

                      <input
                        value={editing.offer_name}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            offer_name:
                              event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: C.gray }}
                        >
                          Actual / Strike Price
                        </label>

                        <input
                          type="number"
                          value={
                            editing.original_price
                          }
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              original_price:
                                event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                        />
                      </div>

                      <div>
                        <label
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: C.gray }}
                        >
                          Offer Price
                        </label>

                        <input
                          type="number"
                          value={editing.offer_price}
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              offer_price:
                                event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: C.gray }}
                        >
                          Offer Starts At
                        </label>

                        <input
                          type="datetime-local"
                          value={
                            editing.offer_start_at
                          }
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              offer_start_at:
                                event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                        />
                      </div>

                      <div>
                        <label
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: C.gray }}
                        >
                          Offer Ends At
                        </label>

                        <input
                          type="datetime-local"
                          value={editing.offer_end_at}
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              offer_end_at:
                                event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="border-t border-gray-100 pt-5">
                  <h3
                    className="mb-3 text-sm font-extrabold"
                    style={{ color: C.dark }}
                  >
                    Dates, Timing & Capacity
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: C.gray }}
                      >
                        Batch Starts
                      </label>

                      <input
                        type="datetime-local"
                        value={editing.start_date}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            start_date:
                              event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: C.gray }}
                      >
                        Batch Ends
                      </label>

                      <input
                        type="datetime-local"
                        value={editing.end_date}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            end_date:
                              event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: C.gray }}
                      >
                        Maximum Students
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={editing.max_students}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            max_students:
                              event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: C.gray }}
                      >
                        Time Slots
                      </label>

                      <textarea
                        rows="3"
                        value={editing.time_slots}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            time_slots:
                              event.target.value,
                          })
                        }
                        className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none"
                        placeholder={
                          "8:30 PM – 9:30 PM\n10:00 AM – 11:00 AM"
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="border-t border-gray-100 pt-5">
                  <h3
                    className="text-sm font-extrabold"
                    style={{ color: C.dark }}
                  >
                    Student Portal Access
                  </h3>

                  <p
                    className="mb-3 mt-1 text-[11px]"
                    style={{ color: C.gray }}
                  >
                    For CAD Tools, disable
                    Pre-Requisites. For BIW,
                    enable them and choose only
                    the required courses.
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ToggleField
                      label="Show Pre-Requisites"
                      checked={
                        editing.show_prerequisites
                      }
                      onChange={(value) =>
                        setEditing({
                          ...editing,
                          show_prerequisites: value,
                        })
                      }
                    />

                    <ToggleField
                      label="Show Sessions"
                      checked={editing.show_sessions}
                      onChange={(value) =>
                        setEditing({
                          ...editing,
                          show_sessions: value,
                        })
                      }
                    />

                    <ToggleField
                      label="Show Assignments"
                      checked={
                        editing.show_assignments
                      }
                      onChange={(value) =>
                        setEditing({
                          ...editing,
                          show_assignments: value,
                        })
                      }
                    />

                    <ToggleField
                      label="Show Progress"
                      checked={editing.show_progress}
                      onChange={(value) =>
                        setEditing({
                          ...editing,
                          show_progress: value,
                        })
                      }
                    />
                  </div>

                  {editing.show_prerequisites && (
                    <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p
                            className="text-xs font-extrabold"
                            style={{ color: C.blue }}
                          >
                            Visible Pre-Requisite Courses
                          </p>

                          <p
                            className="text-[10px]"
                            style={{ color: C.gray }}
                          >
                            No selection means show
                            all. Select specific items
                            for BIW.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              visible_prerequisite_ids:
                                [],
                            })
                          }
                          className="text-[10px] font-bold underline"
                          style={{
                            color: C.primary,
                          }}
                        >
                          Show all
                        </button>
                      </div>

                      <div className="space-y-2">
                        {catalog.map((course) => {
                          const selected =
                            editing.visible_prerequisite_ids.includes(
                              course.id,
                            );

                          return (
                            <label
                              key={course.id}
                              className="flex items-start gap-3 rounded-xl bg-white px-3 py-3"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => {
                                  const current =
                                    editing.visible_prerequisite_ids ||
                                    [];

                                  const next =
                                    event.target
                                      .checked
                                      ? [
                                          ...new Set([
                                            ...current,
                                            course.id,
                                          ]),
                                        ]
                                      : current.filter(
                                          (id) =>
                                            id !==
                                            course.id,
                                        );

                                  setEditing({
                                    ...editing,
                                    visible_prerequisite_ids:
                                      next,
                                  });
                                }}
                                className="mt-0.5 h-4 w-4"
                              />

                              <span>
                                <span
                                  className="block text-xs font-extrabold"
                                  style={{
                                    color: C.dark,
                                  }}
                                >
                                  {course.icon || "•"}{" "}
                                  {course.title}
                                </span>

                                <span
                                  className="block text-[10px]"
                                  style={{
                                    color: C.gray,
                                  }}
                                >
                                  {course._count
                                    ?.lessons ||
                                    0}{" "}
                                  lessons
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setEditing(null)}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-bold"
                  style={{ color: C.gray }}
                >
                  Cancel
                </button>

                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg,${C.blue},${C.primary})`,
                  }}
                >
                  <Save size={15} />
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
