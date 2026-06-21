import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api.js";
import { Input, Button } from "../../components/ui/index.jsx";
import AuthHero from "../../components/shared/AuthHero.jsx";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const sendResetOtp = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!emailOrPhone.trim()) {
      return setErr("Please enter your registered email or phone.");
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(emailOrPhone.trim());
      const resetPhone = res.data?.phone || "";
      setPhone(resetPhone);
      setStep(2);
      setMsg("OTP sent on your registered WhatsApp number.");
    } catch (e) {
      setErr(e.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!otp.trim()) return setErr("Please enter OTP.");
    if (!newPassword) return setErr("Please enter new password.");
    if (newPassword.length < 6) return setErr("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      await authApi.resetPassword(phone, otp.trim(), newPassword);
      setMsg("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/auth/login", { replace: true }), 1000);
    } catch (e) {
      setErr(e.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-white overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-full max-w-sm">
          <Link to="/" className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white mb-3 shadow-lg"
              style={{ background: "linear-gradient(135deg, #007BBF, #003C6E)" }}
            >
              D
            </div>
            <p className="text-sm font-bold tracking-widest text-dct-dark">
              <span className="font-black">DIGITAL</span>
              <span className="text-dct-primary font-black">CAD</span>
            </p>
          </Link>

          <h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">Reset Password</h1>
          <p className="text-sm text-dct-lightgray text-center mb-6">
            {step === 1
              ? "Enter your registered email or phone."
              : "Enter WhatsApp OTP and create a new password."}
          </p>

          {step === 1 ? (
            <form onSubmit={sendResetOtp} className="space-y-4">
              <Input
                label="Email or Phone"
                type="text"
                placeholder="Registered email or mobile number"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />

              {err && <Alert type="error" text={err} />}
              {msg && <Alert type="success" text={msg} />}

              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? "Sending OTP…" : "Send WhatsApp OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-sm text-dct-dark">
                  OTP sent to WhatsApp number ending with <strong>{phone.slice(-4)}</strong>
                </p>
              </div>

              <Input
                label="OTP"
                type="text"
                placeholder="Enter 6 digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Create new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {err && <Alert type="error" text={err} />}
              {msg && <Alert type="success" text={msg} />}

              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? "Resetting…" : "Reset Password"}
              </Button>

              <button
                type="button"
                className="w-full text-sm font-semibold text-dct-primary hover:underline"
                onClick={sendResetOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </form>
          )}

          <p className="text-center text-sm text-dct-gray mt-5">
            Remembered password?{" "}
            <Link to="/auth/login" className="text-dct-primary font-bold hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
      <AuthHero />
    </div>
  );
}

function Alert({ type, text }) {
  const isError = type === "error";
  return (
    <div className={`${isError ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"} border rounded-xl px-4 py-3`}>
      <p className={`${isError ? "text-red-600" : "text-green-700"} text-sm text-center`}>
        {text}
      </p>
    </div>
  );
}
