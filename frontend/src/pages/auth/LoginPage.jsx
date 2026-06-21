import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi } from "../../services/api.js";
import { Input, Button } from "../../components/ui/index.jsx";
import AuthHero from "../../components/shared/AuthHero.jsx";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("student");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    if (!emailOrPhone || !password)
      return setErr("Please enter email/phone and password.");
    setLoading(true);
    try {
      const res = await authApi.login(emailOrPhone, password);
      const role = String(res.data?.user?.role || "student").toLowerCase();

      if (role === "admin") {
        return setErr("Please use the admin login portal.");
      }
      if (tab === "student" && role !== "student") {
        return setErr(
          "This is a tutor account. Please select Tutor tab and login again.",
        );
      }
      if (tab === "tutor" && role !== "tutor") {
        return setErr(
          "This is a student account. Please select Student tab and login again.",
        );
      }

      login(res.data, role);
      if (role === "tutor") navigate("/tutor/dashboard", { replace: true });
      else navigate("/student/courses", { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed. Please check your credentials.");
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
              style={{
                background: "linear-gradient(135deg, #007BBF, #003C6E)",
              }}
            >
              D
            </div>
            <p className="text-sm font-bold tracking-widest text-dct-dark">
              <span className="font-black">DIGITAL</span>
              <span className="text-dct-primary font-black">CAD</span>
            </p>
          </Link>

          <h1 className="text-2xl font-bold text-dct-dark mb-1 text-center">
            Welcome Back
          </h1>
          <p className="text-sm text-dct-lightgray text-center mb-6">
            Sign in to continue learning
          </p>

          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            {[
              ["student", "Student"],
              ["tutor", "Tutor"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setErr("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${tab === key ? "bg-dct-primary text-white" : "bg-white text-dct-gray hover:bg-gray-50"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email or Phone"
              type="text"
              placeholder="Email or mobile number"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {err && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm text-center">{err}</p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/auth/forgot-password")}
                className="text-sm font-semibold text-dct-primary hover:underline bg-transparent border-0 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {tab === "student" && (
            <p className="text-center text-sm text-dct-gray mt-5">
              New student?{" "}
              <Link
                to="/auth/register"
                className="text-dct-primary font-bold hover:underline"
              >
                Create Account
              </Link>
            </p>
          )}
          {tab === "tutor" && (
            <p className="text-center text-xs text-dct-lightgray mt-5">
              Not a tutor yet?{" "}
              <Link
                to="/auth/tutor-register"
                className="text-dct-primary font-bold hover:underline"
              >
                Apply as Tutor
              </Link>
            </p>
          )}
        </div>
      </motion.div>
      <AuthHero />
    </div>
  );
}
