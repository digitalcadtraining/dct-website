import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";
import { batchApi, installmentApi } from "../../services/api.js";
import {
  BookOpen,
  ChevronRight,
  Download,
  FileText,
  PlayCircle,
  X,
} from "lucide-react";

const C = {
  dark: "#1F1A17",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
  lg: "#9ca3af",
};

const money = (v) => Number(v || 0).toLocaleString("en-IN");

function normalizeDate(d) {
  if (!d) return null;
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function deriveBatchStatus(batch) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = normalizeDate(batch?.start_date);
  const end = normalizeDate(batch?.end_date);

  if (start && end) {
    if (now < start) {
      return {
        code: "UPCOMING",
        label: "Upcoming",
        active: false,
      };
    }

    if (now > end) {
      return {
        code: "COMPLETED",
        label: "Completed",
        active: false,
      };
    }

    return {
      code: "ACTIVE",
      label: "Active",
      active: true,
    };
  }

  const code = String(batch?.status || "UPCOMING").toUpperCase();

  if (code === "ACTIVE") {
    return {
      code,
      label: "Active",
      active: true,
    };
  }

  if (code === "COMPLETED") {
    return {
      code,
      label: "Completed",
      active: false,
    };
  }

  return {
    code,
    label: "Upcoming",
    active: false,
  };
}

function safeProgress(value) {
  const n = Number(value || 0);

  if (Number.isNaN(n)) return 0;

  return Math.max(0, Math.min(100, Math.round(n)));
}

function ReceiptModal({ item, onClose, onSaved }) {
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!item) return null;

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await installmentApi.saveReceiptDetails(item.id, {
        payment_method: paymentMethod,
        transaction_ref: transactionRef.trim(),
      });

      await onSaved(item);
    } catch (err) {
      setError(err.message || "Could not save receipt details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-dct-dark">
              Complete Payment Receipt
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The paid amount, batch and payment confirmation time are fixed by
              DCT.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2 text-gray-600"
            aria-label="Close receipt form"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
              Amount paid
            </p>
            <p className="mt-1 font-black text-dct-dark">
              ₹{money(item.amount)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
              Installment
            </p>
            <p className="mt-1 font-black text-dct-dark">{item.label}</p>
          </div>

          <div className="col-span-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
              Received by
            </p>
            <p className="mt-1 font-black text-dct-dark">
              Digital Cad Training &amp; Services
            </p>
          </div>
        </div>

        <label className="block text-sm font-bold text-dct-dark">
          Payment Method
        </label>

        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 font-semibold outline-none focus:border-dct-primary"
        >
          <option value="UPI">UPI</option>
          <option value="GPAY">Google Pay</option>
          <option value="PHONEPE">PhonePe</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CASH">Cash</option>
          <option value="INSTAMOJO">Instamojo</option>
          <option value="OTHER">Other</option>
        </select>

        <label className="mt-5 block text-sm font-bold text-dct-dark">
          {paymentMethod === "CASH"
            ? "Reference (Optional)"
            : "UPI Transaction ID / UTR"}
        </label>

        <input
          value={transactionRef}
          onChange={(event) => setTransactionRef(event.target.value)}
          required={paymentMethod !== "CASH"}
          maxLength={100}
          placeholder={
            paymentMethod === "CASH"
              ? "Optional"
              : "Enter transaction ID or UTR"
          }
          className="mt-2 h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-dct-primary"
        />

        <p className="mt-3 text-xs leading-5 text-gray-500">
          This detail can be submitted once. Contact the admin if a correction
          is required.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-dct-primary font-black text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          <FileText size={18} />
          {saving ? "Creating Receipt..." : "Save & Download Receipt"}
        </button>
      </form>
    </div>
  );
}

function CourseCard({ enrollment, index, onReceipt }) {
  const batch = enrollment.batch || {};
  const course = batch.course || {};
  const tutor = batch.tutor || {};
  const total = batch._count?.scheduled_sessions || 0;
  const pct = safeProgress(enrollment.progress);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const status = deriveBatchStatus(batch);
  const installments = enrollment.installments || [];

  const firstInstallment = installments.find(
    (item) => Number(item.installment_no) === 1,
  );

  const secondInstallment = installments.find(
    (item) => Number(item.installment_no) === 2,
  );

  const thirdInstallment = installments.find(
    (item) => Number(item.installment_no) === 3,
  );

  const paymentCards = [
    ["Start", fmt(batch.start_date)],
    ["End", fmt(batch.end_date)],
    ["Sessions", total],
    ["Assignments", batch._count?.assignments || 0],

    [
      "First EMI",
      firstInstallment ? `₹${money(firstInstallment.amount)}` : "—",
      firstInstallment
        ? firstInstallment.display_status === "PAID"
          ? `PAID · ${fmt(firstInstallment.paid_at)}`
          : firstInstallment.display_status === "DUE"
            ? `DUE · ${fmt(firstInstallment.due_date)}`
            : `Pending · ${fmt(firstInstallment.due_date)}`
        : "Not set",
      firstInstallment?.display_status,
      firstInstallment,
    ],

    [
      "Second EMI",
      secondInstallment ? `₹${money(secondInstallment.amount)}` : "—",
      secondInstallment
        ? secondInstallment.display_status === "PAID"
          ? `PAID · ${fmt(secondInstallment.paid_at)}`
          : secondInstallment.display_status === "DUE"
            ? `DUE · ${fmt(secondInstallment.due_date)}`
            : `Pending · ${fmt(secondInstallment.due_date)}`
        : "Not set",
      secondInstallment?.display_status,
      secondInstallment,
    ],

    ...(thirdInstallment
      ? [
          [
            "Third EMI",
            `₹${money(thirdInstallment.amount)}`,
            thirdInstallment.display_status === "PAID"
              ? `PAID · ${fmt(thirdInstallment.paid_at)}`
              : thirdInstallment.display_status === "DUE"
                ? `DUE · ${fmt(thirdInstallment.due_date)}`
                : `Pending · ${fmt(thirdInstallment.due_date)}`,
            thirdInstallment.display_status,
            thirdInstallment,
          ],
        ]
      : []),
  ];

  return (
    <motion.div
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
      style={{
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
        delay: index * 0.08,
      }}
      whileHover={{
        y: -3,
      }}
    >
      <div
        style={{
          height: 110,
          background: `linear-gradient(135deg,${C.blue},${C.primary})`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div
          style={{
            fontSize: 36,
            opacity: 0.7,
            position: "relative",
            zIndex: 1,
          }}
        >
          ⚙
        </div>

        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: status.active
              ? "rgba(34,197,94,0.95)"
              : "rgba(255,255,255,0.22)",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {status.label}
        </span>

        {enrollment.discount_code && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(255,235,58,.95)",
              color: C.dark,
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {enrollment.discount_code}
          </span>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.dark,
            marginBottom: 3,
            lineHeight: 1.3,
          }}
        >
          {course.name || "Course"}
        </h3>

        <p
          style={{
            fontSize: 11,
            color: C.gray,
            marginBottom: 12,
          }}
        >
          {batch.name}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 7,
            marginBottom: 12,
          }}
        >
          {paymentCards.map(
            ([label, value, sub, paymentStatus, installment]) => (
              <div
                key={label}
                style={{
                  border:
                    paymentStatus === "PAID"
                      ? "1px solid #bbf7d0"
                      : paymentStatus === "DUE"
                        ? "1px solid #fecaca"
                        : "1px solid #e8ecf0",
                  borderRadius: 9,
                  padding: "8px 10px",
                  background:
                    paymentStatus === "PAID"
                      ? "#f0fdf4"
                      : paymentStatus === "DUE"
                        ? "#fef2f2"
                        : "#ffffff",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.dark,
                  }}
                >
                  {value}
                </p>

                <p
                  style={{
                    fontSize: 10,
                    color:
                      paymentStatus === "PAID"
                        ? "#15803d"
                        : paymentStatus === "DUE"
                          ? "#dc2626"
                          : C.lg,
                    fontWeight: paymentStatus ? 700 : 400,
                  }}
                >
                  {sub || label}
                </p>

                {installment?.display_status === "PAID" && (
                  <button
                    type="button"
                    onClick={() => onReceipt(installment)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-green-200 bg-white px-2 py-1.5 text-[10px] font-black text-green-700"
                  >
                    {installment.receipt?.details_completed_at ? (
                      <>
                        <Download size={12} />
                        Download Receipt
                      </>
                    ) : (
                      <>
                        <FileText size={12} />
                        Get Receipt
                      </>
                    )}
                  </button>
                )}
              </div>
            ),
          )}
        </div>

        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#f8fbff",
            border: "1px solid #dbeafe",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: C.blue,
            }}
          >
            Enrolled price: ₹{money(enrollment.enrolled_price)}
          </p>

          <p
            style={{
              fontSize: 10,
              color: C.lg,
            }}
          >
            Registration paid: ₹999
          </p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: C.gray,
              }}
            >
              Your Progress
            </span>

            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.primary,
              }}
            >
              {pct}%
            </span>
          </div>

          <div
            style={{
              height: 5,
              background: "#e5e7eb",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: `linear-gradient(90deg,${C.blue},${C.primary})`,
                borderRadius: 4,
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${pct}%`,
              }}
              transition={{ duration: 1 }}
            />
          </div>

          <p
            style={{
              marginTop: 5,
              fontSize: 10,
              color: C.lg,
            }}
          >
            Progress increases as submitted assignments are counted.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${C.blue},${C.primary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {tutor.name?.[0]?.toUpperCase() || "T"}
          </div>

          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.dark,
              }}
            >
              {tutor.name || "Tutor"}
            </p>

            <p
              style={{
                fontSize: 10,
                color: C.lg,
              }}
            >
              Your Mentor
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <Link
            to="/student/sessions/all"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "9px 0",
              background: `linear-gradient(135deg,${C.blue},${C.primary})`,
              color: "#fff",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sessions
            <ChevronRight size={12} />
          </Link>

          <Link
            to="/student/syllabus"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "9px 0",
              background: "#eff8ff",
              color: C.primary,
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #bfdbfe",
            }}
          >
            Syllabus
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function enrollmentKey(enrollment) {
  return enrollment?.id || enrollment?.enrollment_id || "";
}

function mergePaymentData(courseEnrollments, paymentEnrollments) {
  const paymentMap = new Map(
    (paymentEnrollments || []).map((enrollment) => [
      enrollmentKey(enrollment),
      enrollment,
    ]),
  );

  return (courseEnrollments || []).map((enrollment) => {
    const payment = paymentMap.get(enrollmentKey(enrollment));

    if (!payment) return enrollment;

    return {
      ...enrollment,
      installments: payment.installments || enrollment.installments || [],
      payment_summary: payment.payment_summary || enrollment.payment_summary,
    };
  });
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptItem, setReceiptItem] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [courseRes, paymentRes] = await Promise.all([
        batchApi.enrolled(),
        installmentApi.mine(),
      ]);

      setEnrollments(
        mergePaymentData(courseRes?.data || [], paymentRes?.data || []),
      );
    } catch (err) {
      setError(err.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const onFocus = () => load();

    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const openReceipt = async (item) => {
    if (item.receipt?.details_completed_at) {
      try {
        setError("");

        await installmentApi.downloadReceipt(
          item.id,
          item.receipt.receipt_number
            ? `${item.receipt.receipt_number}.pdf`
            : "DCT-payment-receipt.pdf",
        );
      } catch (err) {
        setError(err.message || "Could not download receipt.");
      }

      return;
    }

    setReceiptItem(item);
  };

  const receiptSaved = async (item) => {
    setReceiptItem(null);
    await load();

    await installmentApi.downloadReceipt(item.id, "DCT-payment-receipt.pdf");
  };

  const hasActive = enrollments.some(
    (enrollment) => deriveBatchStatus(enrollment.batch).code === "ACTIVE",
  );

  return (
    <AppShell>
      {receiptItem && (
        <ReceiptModal
          item={receiptItem}
          onClose={() => setReceiptItem(null)}
          onSaved={receiptSaved}
        />
      )}

      <PageWrapper>
        <motion.div
          className="relative mb-6 overflow-hidden rounded-2xl p-5 sm:p-6"
          style={{
            background: "linear-gradient(135deg,#024981,#007BBF)",
          }}
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -28,
              top: -28,
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />

          <h2
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              marginBottom: 4,
            }}
          >
            Refer and{" "}
            <span
              style={{
                color: "#fde047",
                textDecoration: "underline",
              }}
            >
              Earn ₹2000/-
            </span>{" "}
            reference bonus.
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Feel free to recommend your friend
          </p>

          <Link
            to="/student/refer"
            style={{
              display: "inline-block",
              background: "#1E2023",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Get Reward
          </Link>
        </motion.div>

        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-dct-dark">My Courses</h2>

          {!loading && enrollments.length > 0 && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                hasActive
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {hasActive ? "Active" : "Enrolled"}
            </span>
          )}
        </div>

        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,320px))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  height: 360,
                  background: "#f3f4f6",
                  borderRadius: 16,
                }}
                className="animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="mb-3 font-semibold text-red-600">{error}</p>

            <button
              onClick={load}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && enrollments.length === 0 && (
          <div
            className="mb-8 rounded-2xl border border-gray-100 bg-white p-10 text-center sm:p-14"
            style={{
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />

            <p className="mb-1 font-bold text-dct-dark">
              No courses enrolled yet
            </p>

            <p className="mb-5 text-sm text-dct-lightgray">
              Browse our courses and enroll to start learning.
            </p>

            <Link
              to="/"
              className="inline-block rounded-xl px-6 py-2.5 text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg,${C.blue},${C.primary})`,
              }}
            >
              Browse Courses
            </Link>
          </div>
        )}

        {!loading && !error && enrollments.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,320px))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {enrollments.map((enrollment, index) => (
              <CourseCard
                key={enrollmentKey(enrollment) || index}
                enrollment={enrollment}
                index={index}
                onReceipt={openReceipt}
              />
            ))}
          </div>
        )}

        <div
          className="rounded-3xl border border-blue-100 bg-white p-5 sm:p-6"
          style={{
            boxShadow: "0 12px 34px rgba(2,73,129,.07)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-dct-primary">
                Start before batch begins
              </p>

              <h2 className="mt-1 text-xl font-bold text-dct-dark">
                Complete Pre-Requisite Video Courses
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-dct-gray">
                CATIA basics, UG NX basics and mould design fundamentals are now
                available in a structured video player. Complete lessons in
                sequence to build confidence before live domain training starts.
              </p>
            </div>

            <Link
              to="/student/prerequisites"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-dct-primary px-5 py-3 text-sm font-bold text-white hover:bg-dct-blue"
            >
              <PlayCircle size={18} />
              Open Pre-Requisites
            </Link>
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
