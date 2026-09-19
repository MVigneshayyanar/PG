"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Lock,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function TenantLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    if (clean.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setToastNotice(data.message || "OTP sent! Please enter the verification code.");
      } else {
        setErrorMessage(data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error while sending OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    if (!otp || otp.trim().length < 6) {
      setErrorMessage("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setVerifying(true);
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, otp }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem(
          "tenant_session",
          JSON.stringify({
            tenant: data.tenant,
            token: data.token,
            phone: clean,
          })
        );
        router.push(`/tenant/dashboard?phone=${clean}`);
      } else {
        setErrorMessage(data.error || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error during verification");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="h-7 w-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Tenant Login
            </h1>
            <p className="text-xs text-gray-400">
              Log in with your registered mobile number to access your dashboard.
            </p>
          </div>

          {/* Toast Notice */}
          {toastNotice && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{toastNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Main Form Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5 shadow-2xl">
            {!otpSent ? (
              /* Step 1: Enter Phone Number */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm text-gray-400 font-bold font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full rounded-xl bg-gray-900/90 border border-white/10 pl-14 pr-4 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Your number must be registered by your PG owner.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Verifying +91 <strong>{phoneNumber}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Enter 6-Digit OTP
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-emerald-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="w-full rounded-xl bg-gray-900/90 border border-emerald-500/50 pl-10 pr-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Enter the 6-digit OTP sent to your mobile number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Enter Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
