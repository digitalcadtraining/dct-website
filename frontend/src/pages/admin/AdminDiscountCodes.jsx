import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell.jsx";
import { PageWrapper } from "../../components/ui/index.jsx";
import { discountCodeApi, courseApi } from "../../services/api.js";
import { BadgePercent, Clock, Plus, Power, Pencil, X } from "lucide-react";
import { istInputToIso, isoToIstInput, formatIst } from "../../utils/istDateTime.js";

const C = {
  dark: "#1F1A17",
  blue: "#024981",
  primary: "#007BBF",
  gray: "#6A6B6D",
};

const DEFAULT_FORM = {
  code: "",
  purpose: "",
  discount_price: "16999",
  original_price: "24999",
  course_id: "",
  batch_id: "",
  starts_at: "",
  expires_at: "",
  max_uses: "",
  is_active: true,
};

const fmt = (v) => Number(v || 0).toLocaleString("en-IN");

const statusOf = (row) => {
  const now = new Date();
  if (!row.is_active) {
    return { label: "Disabled", cls: "bg-gray-100 text-gray-600" };
  }
  if (row.starts_at && now < new Date(row.starts_at)) {
    return { label: "Scheduled", cls: "bg-sky-100 text-sky-700" };
  }
  if (row.expires_at && now > new Date(row.expires_at)) {
    return { label: "Expired", cls: "bg-red-100 text-red-700" };
  }
  if (row.max_uses && Number(row.used_count || 0) >= Number(row.max_uses)) {
    return { label: "Limit Over", cls: "bg-orange-100 text-orange-700" };
  }
  return { label: "Live", cls: "bg-green-100 text-green-700" };
};

export default function AdminDiscountCodes() {
  const [codes, setCodes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const load = () => {
    setLoading(true);
    Promise.all([discountCodeApi.list(), courseApi.list()])
      .then(([codesRes, coursesRes]) => {
        setCodes(codesRes.data || []);
        setCourses(coursesRes.data || []);
      })
      .catch((e) => setErr(e.message || "Failed to load discount codes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!form.course_id) {
      setBatches([]);
      return;
    }

    courseApi
      .getBatches(form.course_id)
      .then((res) => setBatches(res.data || []))
      .catch(() => setBatches([]));
  }, [form.course_id]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setEditing(null);
    setErr("");
    setForm(DEFAULT_FORM);
  };

  const startEdit = (row) => {
    setErr("");
    setEditing(row.id);
    setForm({
      code: row.code || "",
      purpose: row.purpose || "",
      discount_price: row.discount_price || "16999",
      original_price: row.original_price || "24999",
      course_id: row.course_id || "",
      batch_id: row.batch_id || "",
      starts_at: isoToIstInput(row.starts_at),
      expires_at: isoToIstInput(row.expires_at),
      max_uses: row.max_uses || "",
      is_active: row.is_active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cleanPayload = () => ({
    ...form,
    code: form.code.toUpperCase().replace(/\s+/g, ""),
    batch_id: form.batch_id || null,
    course_id: form.course_id || null,
    starts_at: istInputToIso(form.starts_at),
    expires_at: istInputToIso(form.expires_at),
    max_uses: form.max_uses || null,
    is_active: Boolean(form.is_active),
  });

  const saveCode = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.code.trim()) return setErr("Discount code is required.");
    if (!form.discount_price) return setErr("Discount price is required.");
    if (!form.expires_at) return setErr("Expiry date/time is required.");

    setSaving(true);
    try {
      const payload = cleanPayload();
      if (editing) {
        await discountCodeApi.update(editing, payload);
      } else {
        await discountCodeApi.create(payload);
      }
      resetForm();
      load();
    } catch (e2) {
      setErr(e2.message || "Failed to save discount code.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (row) => {
    try {
      await discountCodeApi.update(row.id, { is_active: !row.is_active });
      load();
    } catch (e) {
      setErr(e.message || "Unable to update code.");
    }
  };

  return (
    <AppShell>
      <PageWrapper>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: C.dark }}>
              Discount Codes
            </h1>
            <p className="text-sm" style={{ color: C.gray }}>
              Create and edit expiring discount codes for the registration page.
            </p>
          </div>
          <div
            className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm font-bold"
            style={{ color: C.blue }}
          >
            {codes.length} total codes
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
          <form
            onSubmit={saveCode}
            className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4"
            style={{ boxShadow: "0 2px 14px rgba(0,0,0,.05)" }}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <BadgePercent size={20} color={C.primary} />
                <h2 className="font-extrabold" style={{ color: C.dark }}>
                  {editing ? "Edit Discount Code" : "Create Discount Code"}
                </h2>
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold text-gray-600"
                >
                  <X size={12} /> Cancel
                </button>
              )}
            </div>

            <Field label="Discount Code">
              <input
                value={form.code}
                onChange={(e) => update("code", e.target.value.toUpperCase())}
                placeholder="JULY16999"
                className="dct-input w-full"
              />
            </Field>

            <Field label="Purpose">
              <input
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                placeholder="July special admission offer"
                className="dct-input w-full"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount Price">
                <input
                  type="number"
                  value={form.discount_price}
                  onChange={(e) => update("discount_price", e.target.value)}
                  className="dct-input w-full"
                />
              </Field>
              <Field label="Strike Price">
                <input
                  type="number"
                  value={form.original_price}
                  onChange={(e) => update("original_price", e.target.value)}
                  className="dct-input w-full"
                />
              </Field>
            </div>

            <Field label="Course Restriction">
              <select
                value={form.course_id}
                onChange={(e) => update("course_id", e.target.value)}
                className="dct-input w-full"
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Batch Restriction">
              <select
                value={form.batch_id}
                onChange={(e) => update("batch_id", e.target.value)}
                className="dct-input w-full"
              >
                <option value="">All batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Starts At">
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => update("starts_at", e.target.value)}
                className="dct-input w-full"
              />
            </Field>

            <Field label="Expires At">
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => update("expires_at", e.target.value)}
                className="dct-input w-full"
              />
            </Field>

            <Field label="Max Uses">
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => update("max_uses", e.target.value)}
                placeholder="Optional"
                className="dct-input w-full"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update("is_active", e.target.checked)}
              />
              Active discount code
            </label>

            <button
              disabled={saving}
              className="w-full h-12 rounded-2xl text-white font-extrabold flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: `linear-gradient(135deg,${C.blue},${C.primary})` }}
            >
              <Plus size={16} />
              {saving ? "Saving…" : editing ? "Update Discount Code" : "Create Discount Code"}
            </button>
          </form>

          <div
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 2px 14px rgba(0,0,0,.05)" }}
          >
            {loading ? (
              <p className="p-8 text-center text-sm text-gray-500">Loading codes…</p>
            ) : codes.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">No discount codes yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="p-4">Code</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Validity</th>
                      <th className="p-4">Use</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((row) => {
                      const s = statusOf(row);
                      return (
                        <tr key={row.id} className="border-t border-gray-100">
                          <td className="p-4">
                            <strong style={{ color: C.dark }}>{row.code}</strong>
                            <p className="text-xs text-gray-500">
                              {row.purpose || row.course?.name || "General"}
                            </p>
                          </td>
                          <td className="p-4">
                            <strong className="text-green-700">₹{fmt(row.discount_price)}</strong>
                            {row.original_price && (
                              <p className="text-xs text-gray-400 line-through">
                                ₹{fmt(row.original_price)}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Clock size={12} /> {row.starts_at ? `From ${fmtShort(row.starts_at)}` : "Starts now"}
                            </div>
                            <p className="text-xs text-gray-500">Till {fmtShort(row.expires_at)}</p>
                          </td>
                          <td className="p-4 text-xs font-bold">
                            {row.used_count || 0}
                            {row.max_uses ? ` / ${row.max_uses}` : ""}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => startEdit(row)}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                onClick={() => toggle(row)}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold"
                              >
                                <Power size={12} /> {row.is_active ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function fmtShort(v) {
  return formatIst(v);
}
