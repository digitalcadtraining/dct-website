import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  authApi,
  courseApi,
  registrationPaymentApi,
} from "../../services/api.js";
import { Input, Button } from "../../components/ui/index.jsx";
import AuthHero from "../../components/shared/AuthHero.jsx";
import { motion, AnimatePresence } from "framer-motion";

const REGISTRATION_FEE = 999;
const SOFTWARE_TOOL_COURSE_SLUG = "cad-software-tools";
const BATCH_START_DATE = "5 July 2026";

const DELIVERY_MODES = [
  { id: "online", label: "Online Live" },
  { id: "offline-pune-nigdi", label: "Offline - Pune Nigdi" },
  { id: "hybrid", label: "Hybrid" },
];

const SOFTWARE_TOOL_LABELS = {
  "catia-v5": "CATIA V5",
  "ug-nx": "UG NX",
  solidworks: "SolidWorks",
};

const SOFTWARE_TOOL_BATCH_KEYWORDS = {
  "catia-v5": ["catia", "11 am", "11:00"],
  "ug-nx": ["nx", "ug", "12 pm", "12:00"],
  solidworks: ["solidworks", "solid", "1 pm", "1:00"],
};

const SOFTWARE_PRICING = {
  1: { amount: 10000, label: "Any 1 Software Course" },
  2: { amount: 14000, label: "Any 2 Software Courses" },
  3: { amount: 15000, label: "All 3 Software Courses" },
};

function getSoftwarePricing(selected = []) {
  const count = Math.max(1, Math.min(3, selected.length || 1));
  return SOFTWARE_PRICING[count];
}

function getBatchPrice(batch, course) {
  return Number(
    batch?.offer_price || course?.offer_price || course?.price || 0,
  );
}

function getBatchOriginalPrice(batch, course) {
  return Number(
    batch?.original_price || course?.original_price || course?.price || 0,
  );
}

function getDisplayPrice(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function findSoftwareBatch(batches = [], primaryTool, selectedTools = []) {
  const target = primaryTool || selectedTools[0] || "catia-v5";
  const keywords = SOFTWARE_TOOL_BATCH_KEYWORDS[target] || [];
  const found = batches.find((batch) => {
    const text =
      `${batch.name || ""} ${(batch.time_slots || []).join(" ")}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  });
  return found || batches[0];
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [err, setErr] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [phoneToken, setPhoneToken] = useState("");

  const slugFromUrl = searchParams.get("course");
  const courseIdFromUrl = searchParams.get("course_id");
  const primaryToolFromUrl = searchParams.get("primary") || "";

  const softwareToolsFromUrl = (searchParams.get("tools") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const isSoftwareToolsRegistration =
    slugFromUrl === SOFTWARE_TOOL_COURSE_SLUG ||
    softwareToolsFromUrl.length > 0;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    course_id: courseIdFromUrl || "",
    batch_id: "",
    software_tools: softwareToolsFromUrl,
    training_mode: searchParams.get("mode") || "online",
    batch_start_date: searchParams.get("batchStart") || BATCH_START_DATE,
  });

  const courseLocked = Boolean(slugFromUrl || courseIdFromUrl);

  useEffect(() => {
    courseApi
      .list()
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!courses.length) return;

    if (isSoftwareToolsRegistration && !form.course_id) {
      const matched = courses.find((c) => c.slug === SOFTWARE_TOOL_COURSE_SLUG);
      if (matched) setForm((f) => ({ ...f, course_id: matched.id }));
      return;
    }

    if (slugFromUrl && !form.course_id) {
      const matched = courses.find(
        (c) =>
          c.slug === slugFromUrl ||
          c.name.toLowerCase().replace(/\s+/g, "-") === slugFromUrl,
      );
      if (matched) setForm((f) => ({ ...f, course_id: matched.id }));
    }
  }, [courses, slugFromUrl, isSoftwareToolsRegistration, form.course_id]);

  useEffect(() => {
    if (!form.course_id) {
      setBatches([]);
      return;
    }

    courseApi
      .getBatches(form.course_id)
      .then((res) => setBatches(res.data || []))
      .catch(() => setBatches([]));

    setForm((f) => ({ ...f, batch_id: "" }));
  }, [form.course_id]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const selectedCourse = courses.find((c) => c.id === form.course_id);
  const selectedBatch = batches.find((b) => b.id === form.batch_id);

  const selectedSoftwareNames =
    form.software_tools.length > 0
      ? form.software_tools.map((id) => SOFTWARE_TOOL_LABELS[id] || id)
      : ["Selected software course"];

  const softwarePricing = getSoftwarePricing(form.software_tools);
  const selectedBatchPrice = getBatchPrice(selectedBatch, selectedCourse);
  const selectedBatchOriginalPrice = getBatchOriginalPrice(
    selectedBatch,
    selectedCourse,
  );

  const payableAmount = isSoftwareToolsRegistration
    ? softwarePricing.amount
    : selectedBatch
      ? selectedBatchPrice
      : REGISTRATION_FEE;

  const payableLabel = isSoftwareToolsRegistration
    ? softwarePricing.label
    : selectedBatch
      ? "Course Fee"
      : "Registration Fee";

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";

    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) return "Enter a valid 10-digit phone number.";

    if (!form.course_id) {
      return isSoftwareToolsRegistration
        ? "Software tools course not found. Please run backend seed or contact support."
        : "Please select a course.";
    }

    if (!form.batch_id) {
      return batches.length === 0
        ? "No upcoming batches available for this course right now."
        : "Please select a batch.";
    }

    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (form.password !== form.confirm_password)
      return "Passwords do not match.";

    return null;
  };

  const handleSendOtp = async () => {
    setErr("");
    const validErr = validate();
    if (validErr) return setErr(validErr);

    setOtpLoading(true);
    try {
      await authApi.sendOtp(form.phone, "STUDENT_REGISTER");
      setStep(2);
      setCountdown(60);
    } catch (e) {
      setErr(e.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpOnly = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length < 6) return setErr("Enter the complete 6-digit OTP.");

    setLoading(true);
    setErr("");

    try {
      const verifyRes = await authApi.verifyOtp(
        form.phone,
        otpString,
        "STUDENT_REGISTER",
      );
      setPhoneToken(verifyRes.data.phone_token);
      setStep(3);
    } catch (e) {
      setErr(e.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startPayment = async () => {
    setLoading(true);
    setErr("");

    try {
      const paymentRes = await registrationPaymentApi.start({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        course_id: form.course_id,
        batch_id: form.batch_id,
        phone_token: phoneToken,
        software_tools: form.software_tools,
        training_mode: form.training_mode,
        batch_start_date: form.batch_start_date,
        payable_amount: REGISTRATION_FEE,
        selected_course_price: payableAmount,
      });

      const url = paymentRes?.data?.payment_url;
      if (!url) throw new Error("Payment URL not received from Instamojo.");
      window.location.href = url;
    } catch (e) {
      setErr(e.message || "Unable to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (val, idx) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = cleaned;
    setOtp(next);

    if (cleaned && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-white overflow-y-auto py-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-full max-w-sm">
          <Link to="/" className="flex flex-col items-center mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #007BBF, #003C6E)",
              }}
            >
              D
            </div>
            <p className="text-xs font-bold tracking-widest text-dct-dark mt-2">
              <span className="font-black">DIGITAL</span>
              <span className="text-dct-primary font-black">CAD</span> TRAINING
            </p>
          </Link>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">
                  Create Account
                </h1>
                <p className="text-sm text-dct-lightgray text-center mb-6">
                  {isSoftwareToolsRegistration ? (
                    <>
                      Enrolling in{" "}
                      <strong className="text-dct-primary">
                        Software Tools Training
                      </strong>
                    </>
                  ) : selectedCourse ? (
                    <>
                      Enrolling in{" "}
                      <strong className="text-dct-primary">
                        {selectedCourse.name}
                      </strong>
                    </>
                  ) : (
                    "Join DigitalCAD Training"
                  )}
                </p>

                <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-dct-gray">
                  <p className="font-bold text-dct-primary">
                    {payableLabel}: ₹{payableAmount.toLocaleString("en-IN")}
                    {!isSoftwareToolsRegistration &&
                      selectedBatchOriginalPrice > payableAmount && (
                        <span className="ml-2 text-dct-gray line-through">
                          ₹{selectedBatchOriginalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                  </p>
                  <p className="mt-1">
                    Your dashboard access starts only after WhatsApp OTP
                    verification and successful payment.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="rahul@gmail.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />

                  {isSoftwareToolsRegistration ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
                          Select Software Courses
                        </label>
                        <div
                          className="dct-input w-full"
                          style={{
                            background: "#f0f7ff",
                            borderColor: "#bfdbfe",
                            color: "#024981",
                            minHeight: 48,
                          }}
                        >
                          <span className="font-semibold text-sm">
                            {selectedSoftwareNames.join(" + ")}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
                          Training Mode
                        </label>
                        <select
                          value={form.training_mode}
                          onChange={(e) =>
                            update("training_mode", e.target.value)
                          }
                          className="dct-input w-full"
                        >
                          {DELIVERY_MODES.map((mode) => (
                            <option key={mode.id} value={mode.id}>
                              {mode.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
                          Batch Start
                        </label>
                        <div
                          className="dct-input w-full flex items-center justify-between"
                          style={{
                            background: "#fff7ed",
                            borderColor: "#fed7aa",
                            color: "#9a3412",
                          }}
                        >
                          <span className="font-semibold text-sm">
                            {form.batch_start_date}
                          </span>
                          <span className="text-xs font-semibold">
                            Fixed Batch
                          </span>
                        </div>
                      </div>

                      {selectedBatch && (
                        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-xs text-green-800">
                          Batch auto-selected:{" "}
                          <strong>{selectedBatch.name}</strong>
                          {selectedBatch.time_slots?.length > 0
                            ? ` · ${selectedBatch.time_slots.join(", ")}`
                            : ""}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
                        Select Course
                      </label>

                      {courseLocked && selectedCourse ? (
                        <div
                          className="dct-input w-full flex items-center justify-between"
                          style={{
                            background: "#f0f7ff",
                            borderColor: "#bfdbfe",
                            color: "#024981",
                          }}
                        >
                          <span className="font-semibold text-sm">
                            {selectedCourse.name}
                          </span>
                          <span className="text-xs text-blue-400 font-semibold">
                            Pre-selected
                          </span>
                        </div>
                      ) : (
                        <select
                          value={form.course_id}
                          onChange={(e) => update("course_id", e.target.value)}
                          className="dct-input w-full"
                        >
                          <option value="">
                            {courses.length === 0
                              ? "Loading courses…"
                              : "Choose a course…"}
                          </option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} · {c.duration_months} Months
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {!isSoftwareToolsRegistration && form.course_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                    >
                      <label className="block text-xs font-semibold text-dct-gray mb-1.5 uppercase tracking-wider">
                        Select Batch
                      </label>

                      {batches.length === 0 ? (
                        <div className="dct-input w-full text-sm text-dct-lightgray">
                          No upcoming batches available right now
                        </div>
                      ) : (
                        <select
                          value={form.batch_id}
                          onChange={(e) => update("batch_id", e.target.value)}
                          className="dct-input w-full"
                        >
                          <option value="">Choose a batch…</option>
                          {batches.map((b) => (
                            <option
                              key={b.id}
                              value={b.id}
                              disabled={b.is_full}
                            >
                              {b.name}
                              {b.offer_price
                                ? ` — ₹${getDisplayPrice(b.offer_price)}`
                                : ""}
                              {b.is_full
                                ? " — FULL"
                                : ` — ${b.available_seats} seats left`}
                              {b.time_slots?.length > 0
                                ? ` · ${b.time_slots[0]}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      )}

                      {form.batch_id && selectedBatch && (
                        <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-dct-gray space-y-1">
                          <p>
                            <strong>Starts:</strong>{" "}
                            {new Date(
                              selectedBatch.start_date,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          {selectedBatch.time_slots?.length > 0 && (
                            <p>
                              <strong>Timing:</strong>{" "}
                              {selectedBatch.time_slots.join(", ")}
                            </p>
                          )}
                          <p>
                            <strong>Tutor:</strong>{" "}
                            {selectedBatch.tutor_name || "Industry Expert"}
                          </p>
                          <p>
                            <strong>Course Fee:</strong> ₹
                            {getDisplayPrice(selectedBatchPrice)}
                            {selectedBatchOriginalPrice >
                              selectedBatchPrice && (
                              <span className="ml-1 line-through text-dct-lightgray">
                                ₹{getDisplayPrice(selectedBatchOriginalPrice)}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat password"
                    value={form.confirm_password}
                    onChange={(e) => update("confirm_password", e.target.value)}
                  />

                  {err && <ErrorBox message={err} />}

                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                  >
                    {otpLoading
                      ? "Sending OTP…"
                      : "Send WhatsApp OTP & Continue"}
                  </Button>
                </div>

                <p className="text-center text-sm text-dct-gray mt-5">
                  Already have an account?{" "}
                  <Link
                    to="/auth/login"
                    className="text-dct-primary font-bold hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp(["", "", "", "", "", ""]);
                    setErr("");
                  }}
                  className="flex items-center gap-1 text-sm text-dct-gray hover:text-dct-dark mb-5 transition-colors"
                >
                  ← Back
                </button>

                <h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">
                  Verify Phone
                </h1>
                <p className="text-sm text-dct-lightgray text-center mb-2">
                  OTP sent to{" "}
                  <strong className="text-dct-dark">+91 {form.phone}</strong>
                </p>
                <p className="text-xs text-dct-lightgray text-center mb-6">
                  Development mode: check backend terminal for OTP. Production:
                  connect WhatsApp/SMS provider.
                </p>

                <form onSubmit={verifyOtpOnly} className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        className="w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all"
                      />
                    ))}
                  </div>

                  {err && <ErrorBox message={err} />}

                  <Button type="submit" fullWidth size="lg" disabled={loading}>
                    {loading ? "Verifying…" : "Verify OTP"}
                  </Button>

                  <p className="text-center text-xs text-dct-lightgray">
                    {countdown > 0 ? (
                      `Resend OTP in ${countdown}s`
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-dct-primary font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </p>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <button
                  onClick={() => {
                    setStep(2);
                    setErr("");
                  }}
                  className="flex items-center gap-1 text-sm text-dct-gray hover:text-dct-dark mb-5 transition-colors"
                >
                  ← Back
                </button>

                <h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">
                  Confirm Registration
                </h1>
                <p className="text-sm text-dct-lightgray text-center mb-6">
                  Pay to activate your student dashboard.
                </p>

                <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-dct-gray font-bold">
                        {payableLabel}
                      </p>
                      <p className="text-4xl font-black text-dct-primary">
                        ₹{payableAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-dct-primary text-white grid place-items-center font-black">
                      D
                    </div>
                  </div>

                  <div className="text-sm text-dct-gray space-y-2">
                    <p>
                      <strong>Student:</strong> {form.name}
                    </p>
                    <p>
                      <strong>Course:</strong>{" "}
                      {isSoftwareToolsRegistration
                        ? "Software Tools Training"
                        : selectedCourse?.name || "Selected course"}
                    </p>

                    {isSoftwareToolsRegistration && (
                      <>
                        <p>
                          <strong>Software Courses:</strong>{" "}
                          {selectedSoftwareNames.join(" + ")}
                        </p>
                        <p>
                          <strong>Training Mode:</strong>{" "}
                          {DELIVERY_MODES.find(
                            (m) => m.id === form.training_mode,
                          )?.label || form.training_mode}
                        </p>
                        <p>
                          <strong>Batch Start:</strong> {form.batch_start_date}
                        </p>
                      </>
                    )}

                    <p>
                      <strong>Batch:</strong>{" "}
                      {selectedBatch?.name || "Selected batch"}
                    </p>
                    <p>
                      <strong>Phone:</strong> +91 {form.phone}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-blue-100 p-3 text-xs text-dct-gray">
                    After Instamojo confirms payment, your account will be
                    created automatically and you will get dashboard access.
                  </div>
                </div>

                {err && (
                  <div className="mt-4">
                    <ErrorBox message={err} />
                  </div>
                )}

                <Button
                  fullWidth
                  size="lg"
                  onClick={startPayment}
                  disabled={loading}
                  className="mt-5"
                >
                  {loading
                    ? "Opening Payment…"
                    : `Pay ₹${REGISTRATION_FEE.toLocaleString("en-IN")} & Register`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AuthHero />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <p className="text-red-600 text-sm text-center">{message}</p>
    </div>
  );
}
