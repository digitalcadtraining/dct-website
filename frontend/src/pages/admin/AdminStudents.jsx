import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Power,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { adminApi } from "../../services/api.js";
import { cadToolAccessApi } from "../../services/cadToolAccessApi.js";
import { manualRegistrationApi } from "../../services/manualRegistrationApi.js";

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

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

function StatusPill({ status }) {
  const styles = {
    PAID: "bg-green-50 text-green-700 border-green-200",
    DUE: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}

function InstallmentCell({
  item,
  onPaid,
  onPending,
  savingPaymentId,
  emptyAction,
}) {
  if (!item) {
    return emptyAction ? (
      <button
        type="button"
        onClick={emptyAction}
        className="rounded-lg border border-dashed border-dct-primary px-3 py-2 text-[10px] font-black text-dct-primary hover:bg-blue-50"
      >
        Add 3rd EMI
      </button>
    ) : (
      <span className="text-xs text-gray-400">Not set</span>
    );
  }

  const isSaving = savingPaymentId === item.id;

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
          disabled={isSaving}
          onClick={() => onPaid(item)}
          className={`mt-1 rounded-lg px-2 py-1 text-[10px] font-black text-white ${
            isSaving ? "cursor-not-allowed bg-gray-400" : "bg-dct-primary"
          }`}
        >
          {isSaving ? "Updating..." : "Mark Paid"}
        </button>
      )}
    </div>
  );
}

function EmiEditor({ target, onClose, onSaved }) {
  const installments = target?.enrollment?.installments || [];

  const byNumber = (number) =>
    installments.find((item) => Number(item.installment_no) === number);

  const first = byNumber(1);
  const second = byNumber(2);
  const third = byNumber(3);

  const [values, setValues] = useState({
    emi1_amount: Number(first?.amount || 0),
    emi1_due_date: toDateInput(first?.due_date),
    emi2_amount: Number(second?.amount || 0),
    emi2_due_date: toDateInput(second?.due_date),
    emi3_amount: Number(third?.amount || 0),
    emi3_due_date: toDateInput(third?.due_date),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!target) return null;

  const registrationPaid =
    target.enrollment.payment_status === "PAID" ? 999 : 0;

  const expectedEmiTotal = Math.max(
    0,
    Number(target.enrollment.enrolled_price || 0) - registrationPaid,
  );

  const enteredTotal =
    Number(values.emi1_amount || 0) +
    Number(values.emi2_amount || 0) +
    Number(values.emi3_amount || 0);

  const remaining = expectedEmiTotal - enteredTotal;

  const update = (key, value) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await adminApi.updateEnrollmentEmis(target.enrollment.id, {
        installments: [
          {
            installment_no: 1,
            amount: Number(values.emi1_amount),
            due_date: values.emi1_due_date || null,
          },
          {
            installment_no: 2,
            amount: Number(values.emi2_amount),
            due_date: values.emi2_due_date || null,
          },
          {
            installment_no: 3,
            amount: Number(values.emi3_amount),
            due_date: values.emi3_due_date || null,
          },
        ],
      });

      await onSaved();
    } catch (err) {
      setError(err.message || "Could not update EMI structure.");
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    {
      number: 1,
      label: "First EMI",
      item: first,
      amountKey: "emi1_amount",
      dateKey: "emi1_due_date",
    },
    {
      number: 2,
      label: "Second EMI",
      item: second,
      amountKey: "emi2_amount",
      dateKey: "emi2_due_date",
    },
    {
      number: 3,
      label: "Third EMI",
      item: third,
      amountKey: "emi3_amount",
      dateKey: "emi3_due_date",
    },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-dct-dark">
              Edit EMI Structure
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {target.student.name} · {target.enrollment.batch?.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500">
              Course Price
            </p>
            <p className="font-black text-dct-dark">
              {money(target.enrollment.enrolled_price)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase text-gray-500">
              Registration
            </p>
            <p className="font-black text-dct-dark">
              {money(registrationPaid)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase text-gray-500">
              EMI Total
            </p>
            <p className="font-black text-dct-dark">
              {money(expectedEmiTotal)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => {
            const locked = row.item?.display_status === "PAID";

            return (
              <div
                key={row.number}
                className="grid grid-cols-[1fr_130px_150px] items-end gap-3 rounded-2xl border border-gray-100 p-4"
              >
                <div>
                  <p className="text-sm font-black text-dct-dark">
                    {row.label}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    {locked
                      ? "Paid amount is locked to protect its receipt."
                      : "Amount and due date can be edited."}
                  </p>
                </div>

                <label className="block">
                  <span className="text-[10px] font-black uppercase text-gray-500">
                    Amount
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={locked}
                    value={values[row.amountKey]}
                    onChange={(event) =>
                      update(row.amountKey, event.target.value)
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm font-bold disabled:bg-gray-100"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase text-gray-500">
                    Due Date
                  </span>

                  <input
                    type="date"
                    disabled={locked}
                    value={values[row.dateKey]}
                    onChange={(event) =>
                      update(row.dateKey, event.target.value)
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm disabled:bg-gray-100"
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-5 rounded-2xl p-4 text-sm ${
            remaining === 0
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <div className="flex justify-between gap-4 font-black">
            <span>Entered EMI total</span>
            <span>{money(enteredTotal)}</span>
          </div>

          <div className="mt-1 flex justify-between gap-4">
            <span>
              {remaining === 0
                ? "Total matches enrolled price."
                : remaining > 0
                  ? "Still to allocate"
                  : "Amount exceeds required EMI total"}
            </span>

            <span className="font-black">{money(Math.abs(remaining))}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || remaining !== 0}
          className="mt-5 h-12 w-full rounded-xl bg-dct-primary font-black text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {saving ? "Saving..." : "Save EMI Structure"}
        </button>
      </form>
    </div>
  );
}

function CadAccessModal({ target, onClose, onSaved }) {
  const [payload, setPayload] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await cadToolAccessApi.get(target.student.id);

        if (!active) return;

        const data = response.data || {
          batches: [],
        };

        setPayload(data);
        setSelected(
          (data.batches || [])
            .filter((batch) => batch.selected)
            .map((batch) => batch.id),
        );
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load CAD software access.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [target.student.id]);

  const toggleBatch = (batch) => {
    if (batch.locked) return;

    setSelected((current) =>
      current.includes(batch.id)
        ? current.filter((id) => id !== batch.id)
        : [...current, batch.id],
    );
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");

      await cadToolAccessApi.update(target.student.id, selected);
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not update CAD software access.");
    } finally {
      setSaving(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map();

    for (const batch of payload?.batches || []) {
      const key = batch.tool_key || "other";

      if (!map.has(key)) {
        map.set(key, {
          key,
          label: batch.tool_label || "CAD Software",
          batches: [],
        });
      }

      map.get(key).batches.push(batch);
    }

    return Array.from(map.values());
  }, [payload]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-dct-dark">
              Manage CAD Software Access
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {target.student.name} · Select software batches
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
          Additional software access is free and does not create EMI, receipt or
          another payable fee. The student's original paid course cannot be
          removed here.
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-gray-500">
            Loading CAD software batches...
          </div>
        ) : (
          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            {groups.map((group) => (
              <div
                key={group.key}
                className="rounded-2xl border border-gray-100 p-4"
              >
                <h3 className="mb-3 text-sm font-black text-dct-dark">
                  {group.label}
                </h3>

                <div className="space-y-2">
                  {group.batches.map((batch) => {
                    const checked = selected.includes(batch.id);

                    return (
                      <label
                        key={batch.id}
                        className={`flex items-center justify-between gap-4 rounded-xl border p-3 ${
                          checked
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 bg-white"
                        } ${batch.locked ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                      >
                        <div>
                          <p className="text-sm font-black text-dct-dark">
                            {batch.name}
                          </p>

                          <p className="mt-1 text-[10px] text-gray-500">
                            {fmtDate(batch.start_date)} · {batch.status}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {batch.locked && (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-[9px] font-black text-green-700">
                              Paid course
                            </span>
                          )}

                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={batch.locked}
                            onChange={() => toggleBatch(batch)}
                            className="h-5 w-5 accent-dct-primary"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {groups.length === 0 && (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                No active or upcoming CAD Software Tools batches were found.
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={loading || saving}
          className="mt-5 h-12 w-full rounded-xl bg-dct-primary font-black text-white disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {saving ? "Saving Access..." : "Save Software Access"}
        </button>
      </div>
    </div>
  );
}
function ManualEnrollmentModal({ target, onClose, onSaved }) {
  const batch = target.batch;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    coupon_code: "",
    registration_amount: "999",
    payment_ref: "",
  });
  const [preview, setPreview] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const update = (key, value) => {
    setError("");
    setSuccessMessage("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const calculate = async (couponCode = form.coupon_code) => {
    try {
      setError("");
      const response = await manualRegistrationApi.preview({
        batch_id: batch.id,
        coupon_code: String(couponCode || "").trim(),
        registration_amount: Number(form.registration_amount || 0),
      });
      setPreview(response.data || null);
      return response.data || null;
    } catch (err) {
      setPreview(null);
      setError(err.message || "Could not calculate registration price.");
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoadingPrice(true);
        const response = await manualRegistrationApi.preview({
          batch_id: batch.id,
          coupon_code: "",
          registration_amount: 999,
        });
        if (active) setPreview(response.data || null);
      } catch (err) {
        if (active) setError(err.message || "Could not load batch price.");
      } finally {
        if (active) setLoadingPrice(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [batch.id]);

  useEffect(() => {
    if (!loadingPrice) {
      const timer = setTimeout(() => calculate(form.coupon_code), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [form.registration_amount]);

  const applyCoupon = async () => {
    try {
      setApplyingCoupon(true);
      const result = await calculate(form.coupon_code);
      if (result && form.coupon_code.trim()) {
        setSuccessMessage(`Coupon ${result.discount_code || form.coupon_code.trim().toUpperCase()} applied.`);
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Name, email and phone number are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await manualRegistrationApi.create({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        batch_id: batch.id,
        coupon_code: form.coupon_code.trim(),
        registration_amount: Number(form.registration_amount || 0),
        payment_ref: form.payment_ref.trim(),
      });
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not register student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-black text-dct-dark">
              Register New Student
            </h2>
            <p className="mt-1 text-sm text-gray-500">{batch.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-black text-dct-dark">{batch.name}</p>
            <p className="mt-1 text-xs text-gray-600">
              {batch.course?.name} · Starts {fmtDate(batch.start_date)} · {batch.status}
            </p>
            <p className="mt-2 text-xs text-blue-800">
              Admin registration skips OTP and online payment. The entered registration amount is recorded as received.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-xs font-black uppercase text-gray-500">Student Name *</span>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="Full name"
              />
            </label>
            <label>
              <span className="text-xs font-black uppercase text-gray-500">Email *</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="student@gmail.com"
              />
            </label>
            <label>
              <span className="text-xs font-black uppercase text-gray-500">Phone Number *</span>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="10-digit WhatsApp number"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-black uppercase text-gray-500">Login Password *</span>
              <input
                type="text"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="Create password for student login"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-100 p-4">
            <p className="text-sm font-black text-dct-dark">Price & Coupon</p>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={form.coupon_code}
                onChange={(e) => update("coupon_code", e.target.value.toUpperCase())}
                className="h-11 rounded-xl border border-gray-200 px-3 text-sm font-bold"
                placeholder="Coupon code (optional)"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={applyingCoupon || !form.coupon_code.trim()}
                className="rounded-xl bg-dct-primary px-5 text-xs font-black text-white disabled:bg-gray-400"
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>

            {successMessage && (
              <p className="mt-2 text-xs font-bold text-green-700">{successMessage}</p>
            )}

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase text-gray-500">
                Registration Amount Received
              </span>
              <input
                type="number"
                min="0"
                value={form.registration_amount}
                onChange={(e) => update("registration_amount", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-bold"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase text-gray-500">
                Payment Reference Optional
              </span>
              <input
                value={form.payment_ref}
                onChange={(e) => update("payment_ref", e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="Cash / UPI reference / receipt note"
              />
            </label>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              {loadingPrice ? (
                <p className="text-sm text-gray-500">Calculating price...</p>
              ) : preview ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Original price</span><span className="font-black">{money(preview.original_price)}</span></div>
                  <div className="flex justify-between"><span>Final course price</span><span className="font-black text-dct-primary">{money(preview.enrolled_price)}</span></div>
                  <div className="flex justify-between"><span>Registration received</span><span className="font-black text-green-700">{money(preview.registration_amount)}</span></div>
                  <div className="flex justify-between border-t border-gray-200 pt-2"><span>Remaining balance</span><span className="font-black">{money(preview.balance)}</span></div>
                  <div className="mt-3 space-y-2">
                    {(preview.installments || []).map((item) => (
                      <div key={item.installment_no} className="flex justify-between rounded-lg bg-white px-3 py-2 text-xs">
                        <span>{item.label} · {fmtDate(item.due_date)}</span>
                        <span className="font-black">{money(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-5">
          <button
            type="submit"
            disabled={saving || loadingPrice || !preview}
            className="h-12 w-full rounded-xl bg-dct-primary font-black text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving ? "Registering Student..." : "Register Student & Add to Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BatchGroup({
  batch,
  onPaid,
  onPending,
  onToggle,
  onEditEmi,
  onManageCadAccess,
  onManualEnrollment,
  savingPaymentId,
}) {
  const [open, setOpen] = useState(false);

  const active = batch.items.filter((x) => x.student.is_active).length;

  const disabled = batch.items.length - active;

  const activeItems = batch.items.filter((item) => item.student.is_active);

  const received = activeItems.reduce(
    (sum, item) =>
      sum + Number(item.enrollment.payment_summary?.installment_received || 0),
    0,
  );

  const pending = activeItems.reduce(
    (sum, item) => sum + Number(item.enrollment.payment_summary?.pending || 0),
    0,
  );

  const overdue = activeItems.reduce(
    (sum, item) => sum + Number(item.enrollment.payment_summary?.overdue || 0),
    0,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}

            <h3 className="truncate text-sm font-black text-dct-dark">
              {batch.name}
            </h3>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            {active} active · {disabled} disabled · EMI received{" "}
            {money(received)} · Pending {money(pending)} · Overdue{" "}
            {money(overdue)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onManualEnrollment({ batch })}
          className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[10px] font-black text-green-700 hover:bg-green-100"
        >
          Register Student
        </button>
      </div>

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
              {[...batch.items]
                .sort(
                  (a, b) =>
                    Number(b.student.is_active) - Number(a.student.is_active),
                )
                .map(({ student, enrollment }) => {
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
                          item={installments.find(
                            (item) => Number(item.installment_no) === 1,
                          )}
                          onPaid={onPaid}
                          onPending={onPending}
                          savingPaymentId={savingPaymentId}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <InstallmentCell
                          item={installments.find(
                            (item) => Number(item.installment_no) === 2,
                          )}
                          onPaid={onPaid}
                          onPending={onPending}
                          savingPaymentId={savingPaymentId}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <InstallmentCell
                          item={installments.find(
                            (item) => Number(item.installment_no) === 3,
                          )}
                          onPaid={onPaid}
                          onPending={onPending}
                          savingPaymentId={savingPaymentId}
                          emptyAction={() =>
                            onEditEmi({
                              student,
                              enrollment,
                            })
                          }
                        />

                        {installments.some(
                          (item) => Number(item.installment_no) === 3,
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              onEditEmi({
                                student,
                                enrollment,
                              })
                            }
                            className="mt-2 text-[10px] font-bold text-dct-primary underline"
                          >
                            Edit EMI Structure
                          </button>
                        )}
                      </td>

                      <td
                        className={`px-4 py-4 text-xs font-black ${
                          Number(enrollment.payment_summary?.balance || 0) > 0
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {money(enrollment.payment_summary?.balance)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black ${
                            student.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
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

                        {/(catia|solidworks|solid works|ug nx|\bnx\b)/i.test(
                          String(enrollment.batch?.name || ""),
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              onManageCadAccess({
                                student,
                                enrollment,
                              })
                            }
                            className="mt-2 block rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black text-dct-primary"
                          >
                            Manage CAD Access
                          </button>
                        )}
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
  const [payload, setPayload] = useState({
    students: [],
    summary: {},
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingPaymentId, setSavingPaymentId] = useState("");
  const [emiTarget, setEmiTarget] = useState(null);
  const [cadAccessTarget, setCadAccessTarget] = useState(null);
  const [manualEnrollmentTarget, setManualEnrollmentTarget] = useState(null);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const res = await adminApi.feeTracker();

      setPayload(
        res.data || {
          students: [],
          summary: {},
        },
      );
    } catch (err) {
      setError(err.message || "Failed to load fee tracker.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();

    const map = new Map();

    for (const student of payload.students || []) {
      for (const enrollment of student.enrollments || []) {
        if (
          String(enrollment.discount_code || "").toUpperCase() ===
          "CAD_TOOL_ACCESS"
        ) {
          continue;
        }

        const batch = enrollment.batch || {};

        const haystack =
          `${student.name} ${student.email} ${student.phone} ${batch.name} ${batch.course?.name}`.toLowerCase();

        if (query && !haystack.includes(query)) {
          continue;
        }

        const key = batch.id || "unassigned";

        if (!map.has(key)) {
          map.set(key, {
            ...batch,
            id: key,
            name: batch.name || "No Batch",
            items: [],
          });
        }

        map.get(key).items.push({
          student,
          enrollment,
        });
      }
    }

    return Array.from(map.values());
  }, [payload.students, search]);

  const markPaid = async (item) => {
    if (!item?.id || savingPaymentId) {
      return;
    }

    try {
      setSavingPaymentId(item.id);
      setError("");

      await adminApi.markInstallmentPaid(item.id, {
        payment_method: "ADMIN",
        payment_ref: "",
      });

      await load(true);
    } catch (err) {
      setError(err.message || "Could not mark installment as paid.");
    } finally {
      setSavingPaymentId("");
    }
  };

  const markPending = async (item) => {
    try {
      if (!window.confirm(`Reset ${item.label} to pending?`)) {
        return;
      }

      setError("");

      await adminApi.markInstallmentPending(item.id);

      await load(true);
    } catch (err) {
      setError(err.message || "Could not reset installment.");
    }
  };

  const toggle = async (id) => {
    await adminApi.toggleUserStatus(id);
    await load();
  };

  const emiSaved = async () => {
    setEmiTarget(null);
    await load(true);
  };

  const cadAccessSaved = async () => {
    setCadAccessTarget(null);
    await load(true);
  };

  const manualEnrollmentSaved = async () => {
    setManualEnrollmentTarget(null);
    await load(true);
  };

  const summary = payload.summary || {};

  return (
    <AppShell>
      {emiTarget && (
        <EmiEditor
          target={emiTarget}
          onClose={() => setEmiTarget(null)}
          onSaved={emiSaved}
        />
      )}

      {cadAccessTarget && (
        <CadAccessModal
          target={cadAccessTarget}
          onClose={() => setCadAccessTarget(null)}
          onSaved={cadAccessSaved}
        />
      )}

      {manualEnrollmentTarget && (
        <ManualEnrollmentModal
          target={manualEnrollmentTarget}
          onClose={() => setManualEnrollmentTarget(null)}
          onSaved={manualEnrollmentSaved}
        />
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
                onChange={(event) => setSearch(event.target.value)}
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
            ["Students", summary.total_students],
            ["Active", summary.active_students],
            ["Disabled", summary.disabled_students],
            ["Registration", money(summary.registration_received)],
            ["EMI Received", money(summary.emi_received)],
            ["Overdue", money(summary.overdue_emi)],
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
                onEditEmi={setEmiTarget}
                onManageCadAccess={setCadAccessTarget}
                onManualEnrollment={setManualEnrollmentTarget}
                savingPaymentId={savingPaymentId}
              />
            ))}
          </div>
        )}
      </PageWrapper>
    </AppShell>
  );
}
