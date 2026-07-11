import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Power,
  RefreshCcw,
  Search,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi } from "../../services/api.js";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";

function StatusPill({ status }) {
  const styles = {
    PAID: "bg-green-50 text-green-700 border-green-200",
    DUE: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${styles[status] || styles.PENDING}`}
    >
      {status}
    </span>
  );
}

function InstallmentCell({ item, onPaid, onPending }) {
  if (!item) return <span className="text-xs text-gray-400">Not set</span>;
  return (
    <div className="min-w-[130px]">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-dct-dark">
          {money(item.amount)}
        </span>
        <StatusPill status={item.display_status} />
      </div>
      <p className="mt-1 text-[10px] text-gray-500">
        {item.display_status === "PAID"
          ? `Paid ${fmtDate(item.paid_at)}`
          : `Due ${fmtDate(item.due_date)}`}
      </p>
      {item.display_status === "PAID" ? (
        <button
          type="button"
          onClick={() => onPending(item)}
          className="mt-1 text-[10px] font-bold text-gray-500 underline"
        >
          Undo
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onPaid(item)}
          className="mt-1 rounded-lg bg-dct-primary px-2 py-1 text-[10px] font-black text-white"
        >
          Mark Paid
        </button>
      )}
    </div>
  );
}

function BatchGroup({ batch, onPaid, onPending, onToggle }) {
  const [open, setOpen] = useState(true);
  const active = batch.items.filter((x) => x.student.is_active).length;
  const disabled = batch.items.length - active;
const activeItems = batch.items.filter(
  (item) => item.student.is_active,
);

const received = activeItems.reduce(
  (sum, item) =>
    sum +
    Number(
      item.enrollment.payment_summary
        ?.installment_received || 0,
    ),
  0,
);

const pending = activeItems.reduce(
  (sum, item) =>
    sum +
    Number(
      item.enrollment.payment_summary?.pending || 0,
    ),
  0,
);

const overdue = activeItems.reduce(
  (sum, item) =>
    sum +
    Number(
      item.enrollment.payment_summary?.overdue || 0,
    ),
  0,
);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50"
      >
        <div>
          <div className="flex items-center gap-2">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <h3 className="text-sm font-black text-dct-dark">{batch.name}</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {active} active · {disabled} disabled · EMI received{" "}
            {money(received)} · Pending {money(pending)} · Overdue{" "}
            {money(overdue)}
          </p>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course Price</th>
                <th className="px-4 py-3">First EMI</th>
                <th className="px-4 py-3">Second EMI</th>
                <th className="px-4 py-3">Third EMI / Extra</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Account</th>
              </tr>
            </thead>
            <tbody>
              {batch.items.map(({ student, enrollment }) => {
                const installments = enrollment.installments || [];
                return (
                  <tr
                    key={`${student.id}-${enrollment.id}`}
                    className="border-t border-gray-50 align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-dct-dark">
                        {student.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {student.phone} · {student.email}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs font-black text-dct-primary">
                      {money(enrollment.enrolled_price)}
                    </td>
                    <td className="px-4 py-4">
                      <InstallmentCell
                        item={installments.find((x) => x.installment_no === 1)}
                        onPaid={onPaid}
                        onPending={onPending}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <InstallmentCell
                        item={installments.find((x) => x.installment_no === 2)}
                        onPaid={onPaid}
                        onPending={onPending}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <InstallmentCell
                        item={installments.find((x) => x.installment_no === 3)}
                        onPaid={onPaid}
                        onPending={onPending}
                      />
                    </td>
                    <td
                      className={`px-4 py-4 text-xs font-black ${Number(enrollment.payment_summary?.balance || 0) > 0 ? "text-red-600" : "text-green-700"}`}
                    >
                      {money(enrollment.payment_summary?.balance)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black ${student.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                      >
                        {student.is_active ? "Active" : "Disabled"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggle(student.id)}
                        className="ml-2 rounded-lg border border-gray-200 p-2"
                        title="Enable or disable student"
                      >
                        <Power size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminStudents() {
  const [payload, setPayload] = useState({ students: [], summary: {} });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [payingItem, setPayingItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await adminApi.feeTracker();
      setPayload(res.data || { students: [], summary: {} });
    } catch (err) {
      setError(err.message || "Failed to load fee tracker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map();
    for (const student of payload.students || []) {
      for (const enrollment of student.enrollments || []) {
        const batch = enrollment.batch || {};
        const hay =
          `${student.name} ${student.email} ${student.phone} ${batch.name} ${batch.course?.name}`.toLowerCase();
        if (q && !hay.includes(q)) continue;
        const key = batch.id || "unassigned";
        if (!map.has(key))
          map.set(key, { id: key, name: batch.name || "No Batch", items: [] });
        map.get(key).items.push({ student, enrollment });
      }
    }
    return Array.from(map.values());
  }, [payload.students, search]);

  const markPaid = (item) => {
    setPayingItem(item);
    setPaymentMethod("UPI");
    setPaymentRef("");
    setError("");
  };

  const submitPayment = async () => {
    if (!payingItem) return;

    try {
      setSavingPayment(true);
      setError("");

      await adminApi.markInstallmentPaid(payingItem.id, {
        payment_method: paymentMethod,
        payment_ref: paymentRef,
      });

      setPayingItem(null);
      setPaymentMethod("UPI");
      setPaymentRef("");

      await load();
    } catch (err) {
      setError(err.message || "Could not mark installment as paid.");
    } finally {
      setSavingPayment(false);
    }
  };

  const markPending = async (item) => {
    try {
      if (!window.confirm(`Reset ${item.label} to pending?`)) return;

      setError("");

      await adminApi.markInstallmentPending(item.id);

      await load();
    } catch (err) {
      setError(err.message || "Could not reset installment.");
    }
  };

  const toggle = async (id) => {
    await adminApi.toggleUserStatus(id);
    await load();
  };

  const s = payload.summary || {};
  return (
    <AppShell>
      {payingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black mb-5">Mark Installment Paid</h2>

            <div className="mb-4">
              <label className="text-sm font-bold">Payment Method</label>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option>UPI</option>
                <option>CASH</option>
                <option>BANK_TRANSFER</option>
                <option>PHONEPE</option>
                <option>GPAY</option>
                <option>OTHER</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="text-sm font-bold">UTR / Reference</label>

              <input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
                placeholder="Optional"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPayingItem(null)}
                className="flex-1 rounded-xl border py-3 font-bold"
              >
                Cancel
              </button>

              <button
                onClick={submitPayment}
                disabled={savingPayment}
                className="flex-1 rounded-xl bg-dct-primary py-3 font-bold text-white"
              >
                {savingPayment ? "Saving..." : "Confirm Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageWrapper>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-dct-dark">
              Batch Fee Tracker
            </h1>
            <p className="text-sm text-gray-500">
              All students remain visible, including disabled accounts.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm"
                placeholder="Search student or batch"
              />
            </div>
            <button
              type="button"
              onClick={load}
              className="rounded-xl border border-gray-200 bg-white p-2.5"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            ["Students", s.total_students],
            ["Active", s.active_students],
            ["Disabled", s.disabled_students],
            ["Registration", money(s.registration_received)],
            ["EMI Received", money(s.emi_received)],
            ["Overdue", money(s.overdue_emi)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <p className="text-lg font-black text-dct-dark">{value || 0}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        {!loading && (
          <div className="space-y-5">
            {groups.map((batch) => (
              <BatchGroup
                key={batch.id}
                batch={batch}
                onPaid={markPaid}
                onPending={markPending}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
