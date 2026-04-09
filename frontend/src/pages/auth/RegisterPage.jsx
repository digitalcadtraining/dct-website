/**
 * RegisterPage.jsx — Fixed
 *
 * Fixes:
 * 1. Reads ?course=<slug> OR ?course_id=<id> from URL
 * 2. After courses load → finds matching course by slug and sets course_id
 * 3. Locks the course dropdown when pre-selected via URL
 * 4. Batch dropdown shows only that course's UPCOMING batches
 * 5. Proper loading / empty / error state for courses dropdown
 */
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi, courseApi } from "../../services/api.js";
import { Input, Button } from "../../components/ui/index.jsx";
import AuthHero from "../../components/shared/AuthHero.jsx";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesLoadError, setCoursesLoadError] = useState("");
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [err, setErr] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const slugFromUrl = searchParams.get("course");
  const courseIdFromUrl = searchParams.get("course_id");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    course_id: courseIdFromUrl || "",
    batch_id: "",
  });

  const courseLocked = Boolean(slugFromUrl || courseIdFromUrl);

  useEffect(() => {
    let mounted = true;
    setCoursesLoading(true);
    setCoursesLoadError("");

    courseApi
      .list()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setCourses(list);

        if (list.length === 0) {
          setCoursesLoadError("No courses available right now.");
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setCourses([]);
        setCoursesLoadError(e?.message || "Failed to load courses.");
      })
      .finally(() => {
        if (!mounted) return;
        setCoursesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!courses.length) return;

    if (slugFromUrl && !form.course_id) {
      const matched = courses.find(
        (c) =>
          c.slug === slugFromUrl ||
          c.name?.toLowerCase().replace(/\s+/g, "-") === slugFromUrl
      );

      if (matched) {
        setForm((f) => ({ ...f, course_id: matched.id }));
      }
    }
  }, [courses, slugFromUrl, form.course_id]);

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

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";

    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) return "Enter a valid 10-digit phone number.";

    if (!form.course_id) {
      if (coursesLoading) return "Courses are still loading. Please wait.";
      if (coursesLoadError) return coursesLoadError;
      return "Please select a course.";
    }

    if (!form.batch_id) {
      return batches.length === 0
        ? "No upcoming batches available for this course right now."
        : "Please select a batch.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirm_password) {
      return "Passwords do not match.";
    }

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

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length < 6) {
      return setErr("Enter the complete 6-digit OTP.");
    }

    setLoading(true);
    setErr("");

    try {
      const verifyRes = await authApi.verifyOtp(
        form.phone,
        otpString,
        "STUDENT_REGISTER"
      );
      const phone_token = verifyRes.data.phone_token;

      const registerRes = await authApi.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        course_id: form.course_id,
        batch_id: form.batch_id,
        phone_token,
      });

      login(registerRes.data);
      navigate("/student/courses");
    } catch (e) {
      setErr(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (val, idx) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = cleaned;
    setOtp(next);

    if (cleaned && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const selectedCourse = courses.find((c) => c.id === form.course_id);

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
              style={{ background: "linear-gradient(135deg, #007BBF, #003C6E)" }}
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
                  {selectedCourse ? (
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
                      <>
                        <select
                          value={form.course_id}
                          onChange={(e) => update("course_id", e.target.value)}
                          className="dct-input w-full"
                          disabled={coursesLoading}
                        >
                          <option value="">
                            {coursesLoading
                              ? "Loading courses..."
                              : coursesLoadError
                              ? "Unable to load courses"
                              : courses.length === 0
                              ? "No courses available"
                              : "Choose a course..."}
                          </option>

                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} — ₹
                              {Number(c.price).toLocaleString("en-IN")} ·{" "}
                              {c.duration_months} Months
                            </option>
                          ))}
                        </select>

                        {!coursesLoading && coursesLoadError && (
                          <p className="mt-2 text-xs text-red-600">
                            {coursesLoadError}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {form.course_id && (
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
                            <option key={b.id} value={b.id} disabled={b.is_full}>
                              {b.name}
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

                      {form.batch_id &&
                        (() => {
                          const b = batches.find((x) => x.id === form.batch_id);
                          if (!b) return null;

                          return (
                            <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-dct-gray space-y-1">
                              <p>
                                <strong>Starts:</strong>{" "}
                                {new Date(b.start_date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                              {b.time_slots?.length > 0 && (
                                <p>
                                  <strong>Timing:</strong>{" "}
                                  {b.time_slots.join(", ")}
                                </p>
                              )}
                              <p>
                                <strong>Tutor:</strong>{" "}
                                {b.tutor_name || "Industry Expert"}
                              </p>
                            </div>
                          );
                        })()}
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

                  {err && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-red-600 text-sm text-center">{err}</p>
                    </div>
                  )}

                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleSendOtp}
                    disabled={otpLoading || coursesLoading}
                  >
                    {otpLoading ? "Sending OTP…" : "Send OTP & Continue"}
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
                  OTP sent to <strong className="text-dct-dark">+91 {form.phone}</strong>
                </p>

                <p className="text-xs text-dct-lightgray text-center mb-6">
                  Check your backend terminal for OTP during development
                </p>

                <form onSubmit={handleVerifyAndRegister} className="space-y-6">
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
                        style={{
                          borderColor: digit ? "#007BBF" : "#e5e7eb",
                          color: "#1F1A17",
                        }}
                      />
                    ))}
                  </div>

                  {err && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-red-600 text-sm text-center">{err}</p>
                    </div>
                  )}

                  <Button type="submit" fullWidth size="lg" disabled={loading}>
                    {loading ? "Creating account…" : "Verify & Create Account"}
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
          </AnimatePresence>
        </div>
      </motion.div>

      <AuthHero />
    </div>
  );
}