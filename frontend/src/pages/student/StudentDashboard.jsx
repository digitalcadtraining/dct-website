import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { batchApi } from "../../services/api.js";
import { studentMoney, zonedDateTime, timeZoneLabel } from "../../utils/internationalDisplay.js";

const QUICK = [
  {
    label: "All Sessions",
    icon: CalendarDays,
    to: "/student/sessions/all",
    color: "bg-blue-50 text-dct-primary",
  },
  {
    label: "My Assignments",
    icon: ClipboardList,
    to: "/student/assignments/all",
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "My Courses",
    icon: BookOpen,
    to: "/student/courses",
    color: "bg-green-50 text-green-600",
  },
  {
    label: "My Queries",
    icon: HelpCircle,
    to: "/student/queries",
    color: "bg-orange-50 text-orange-600",
  },
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";

function PaymentCard({ enrollment }) {
  const international = enrollment.international || null;
  const formatAmount = (amount) => studentMoney(amount, international);
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      {international && (
        <p className="mb-3 text-xs text-blue-700">
          Displayed amounts are approximate USD values
          {international.fx?.date ? ` · Rate date: ${international.fx.date}` : ""}.
          Confirm the payment currency with DCT before transferring funds.
        </p>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-dct-dark">Payment Status</h3>
          <p className="text-xs text-gray-500">
            {enrollment.batch?.course?.name || "Course"} ·{" "}
            {enrollment.batch?.name || "Batch"}
          </p>
        </div>

        <span className="text-sm font-black text-dct-primary">
          Balance {formatAmount(enrollment.payment_summary?.balance)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-xs font-bold text-green-700">Registration</p>
          <p className="mt-1 text-lg font-black text-green-800">
            {international
              ? formatAmount(enrollment.payment_summary?.registration_received)
              : "₹999"}
          </p>
          <p className="text-[11px] font-bold text-green-700">
            {international ? (enrollment.payment_status === "PAID" ? "PAID" : "PENDING") : "PAID"}
          </p>
        </div>

        {(enrollment.installments || []).map((item) => {
          const cardStyle =
            item.display_status === "PAID"
              ? "bg-green-50 text-green-800"
              : item.display_status === "DUE"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-800";

          return (
            <div key={item.id} className={`rounded-2xl p-4 ${cardStyle}`}>
              <p className="text-xs font-bold">{item.label}</p>

              <p className="mt-1 text-lg font-black">
                {formatAmount(item.amount)}
              </p>

              <p className="text-[11px] font-black">
                {item.display_status}
              </p>

              <p className="mt-1 text-[10px]">
                {item.display_status === "PAID"
                  ? `Paid ${fmtDate(item.paid_at)}`
                  : `Due ${fmtDate(item.due_date)}`}
              </p>
            </div>
          );
        })}
      </div>

      {Number(enrollment.payment_summary?.overdue || 0) > 0 && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          Payment overdue. Please contact Digital CAD Training.
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPayments = async () => {
      setLoadingPayments(true);
      setPaymentError("");

      try {
        const response = await batchApi.enrolled();

        if (!cancelled) {
          setPayments(response?.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setPayments([]);
          setPaymentError(
            error.message || "Could not load payment details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPayments(false);
        }
      }
    };

    loadPayments();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <PageWrapper>
        <h2 className="mb-6 text-xl font-bold text-dct-dark">
          Welcome back! 👋
        </h2>

        <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {QUICK.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <Link
                to={item.to}
                className="dct-card group flex flex-col items-center gap-3 p-5 transition-all hover:shadow-card-hover"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}
                >
                  <item.icon size={22} />
                </div>

                <span className="text-center text-sm font-semibold text-dct-dark">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {loadingPayments && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm font-semibold text-gray-500">
            Loading payment details...
          </div>
        )}

        {!loadingPayments && paymentError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600">
            {paymentError}
          </div>
        )}

        {!loadingPayments && !paymentError && payments.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm font-semibold text-gray-500">
            No payment schedule is available yet.
          </div>
        )}

        {!loadingPayments && !paymentError && payments.length > 0 && (
          <div className="space-y-5">
            {payments.filter((enrollment) => enrollment.international).map((enrollment) => {
              const profile = enrollment.international;
              const next = enrollment.batch?.next_live_session;
              const local = next && zonedDateTime(next.scheduled_at, profile.time_zone, {
                weekday: "short", day: "numeric", month: "short", year: "numeric",
                hour: "numeric", minute: "2-digit", timeZoneName: "short",
              });
              return (
                <div key={`international-${enrollment.id}`}
                  className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-xs font-black uppercase text-blue-700">Your local batch schedule</p>
                  <p className="mt-1 font-black text-dct-dark">
                    {enrollment.batch?.name} · {profile.country_name}
                  </p>
                  <p className="mt-2 text-sm font-bold text-dct-primary">
                    {next && local
                      ? `Next: ${next.name || `Session ${next.session_number}`} · ${local}`
                      : "No upcoming live session has been scheduled."}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Time zone: {timeZoneLabel(profile.time_zone)} · Dates automatically
                    account for daylight saving time.
                  </p>
                </div>
              );
            })}
            {payments.map((enrollment) => (
              <PaymentCard
                key={enrollment.id}
                enrollment={enrollment}
              />
            ))}
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}