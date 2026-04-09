import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi } from "../../services/api.js";
import { Input, Button } from "../../components/ui/index.jsx";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !password) return setErr("Email and password required.");
    setLoading(true);
    try {
      const res = await authApi.adminLogin(email, password);
      login(res.data);
      navigate("/admin/dashboard");
    } catch (e) {
      setErr(e.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0c0b" }}>
      <motion.div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl"
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg mb-2"
            style={{ background: "linear-gradient(135deg, #007BBF, #003C6E)" }}>D</div>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Admin Portal</p>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-900 mb-6">Admin Sign In</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Admin Email" type="email" placeholder="admin@digitalcadtraining.com"
            value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" placeholder="Admin password"
            value={password} onChange={e => setPassword(e.target.value)} />
          {err && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm text-center">{err}</p>
            </div>
          )}
          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
