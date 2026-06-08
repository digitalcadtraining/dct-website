import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { registrationPaymentApi } from "../../services/api.js";
import { Button } from "../../components/ui/index.jsx";

export default function RegisterPaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment with Instamojo...");
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const registration_id = searchParams.get("registration_id");
    const payment_request_id = searchParams.get("payment_request_id") || searchParams.get("payment_request");
    const payment_id = searchParams.get("payment_id") || searchParams.get("payment");

    if (!registration_id) {
      setStatus("failed");
      setMessage("Registration ID missing. Please contact DCT support with your Instamojo payment screenshot.");
      return;
    }

    registrationPaymentApi.verify({ registration_id, payment_request_id, payment_id })
      .then((res) => {
        const data = res.data;
        login(data, "student");
        setDetails(data);
        setStatus("success");
        setMessage("Registration successful. Your dashboard access is activated.");
      })
      .catch((err) => {
        setStatus("failed");
        setMessage(err.message || "Payment verification failed. Please contact support.");
      });
  }, [searchParams, login]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl text-center"
      >
        <Link to="/" className="inline-flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #007BBF, #003C6E)" }}>D</div>
          <p className="text-xs font-bold tracking-widest text-dct-dark mt-2">
            <span className="font-black">DIGITAL</span><span className="text-dct-primary font-black">CAD</span> TRAINING
          </p>
        </Link>

        {status === "verifying" && (
          <>
            <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-blue-100 border-t-dct-primary animate-spin" />
            <h1 className="text-2xl font-black text-dct-dark">Please wait...</h1>
            <p className="mt-3 text-sm text-dct-gray">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-green-100 text-green-600 grid place-items-center text-3xl">✓</div>
            <h1 className="text-2xl font-black text-dct-dark">Registration Successful</h1>
            <p className="mt-3 text-sm text-dct-gray">{message}</p>
            {details?.course_name && <p className="mt-4 text-sm"><strong>Course:</strong> {details.course_name}</p>}
            {details?.batch_name && <p className="text-sm"><strong>Batch:</strong> {details.batch_name}</p>}
            <Button fullWidth size="lg" onClick={() => navigate("/student/dashboard")} className="mt-6">
              Go to Student Dashboard
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-red-100 text-red-600 grid place-items-center text-3xl">!</div>
            <h1 className="text-2xl font-black text-dct-dark">Verification Pending</h1>
            <p className="mt-3 text-sm text-dct-gray">{message}</p>
            <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-dct-gray text-left">
              <p className="font-bold text-dct-primary">What to do now?</p>
              <p className="mt-1">If money was debited, do not pay again immediately. Send payment screenshot to DCT support for manual verification.</p>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <Button fullWidth size="lg" onClick={() => navigate("/auth/register")}>Try Again</Button>
              <a className="text-sm font-bold text-dct-primary" href="https://wa.me/918591719044" target="_blank" rel="noreferrer">Contact DCT Support</a>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
