import React, { useState } from "react";
import axios from "axios";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { API_BASE } from "../apiConfig";
import { persistAuthSession } from "../authSession";

const OtpVerification = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState(state?.otpRequestId || "");
  const email = state?.email || "";

  if (!otpRequestId) {
    return <Navigate to="/login" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otpCode)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setBusy(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/user/verify-otp`,
        { otpRequestId, otpCode },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success && response.data.token) {
        persistAuthSession(response.data.token, response.data.user);
        window.dispatchEvent(new Event("authStateChanged"));
        setSuccess("OTP verified. Redirecting...");
        setTimeout(() => navigate("/dashboard"), 700);
      } else {
        setError(response.data.message || "OTP verification failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to verify OTP.");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResendBusy(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/user/send-otp`,
        { otpRequestId },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.success) {
        if (response.data.otpRequestId) {
          setOtpRequestId(response.data.otpRequestId);
        }
        setSuccess("New OTP sent to email and SMS.");
      } else {
        setError(response.data.message || "Could not resend OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend OTP.");
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
        <Link to="/login" className="inline-flex items-center text-sm text-gray-300 mb-4">
          <FaArrowLeft className="mr-2" />
          Back to Login
        </Link>
        <h2 className="text-2xl font-semibold mb-2">Two-Factor Verification</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter the 6-digit OTP sent to {email || "your email"} and your phone.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit OTP"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-center tracking-[0.5em] text-lg outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded py-3 font-medium"
          >
            {busy ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendBusy}
          className="w-full mt-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 rounded py-3 text-sm"
        >
          {resendBusy ? "Sending..." : "Resend OTP"}
        </button>
      </div>
    </div>
  );
};

export default OtpVerification;
