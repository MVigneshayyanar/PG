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
  RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { sendFirebaseOtp, confirmFirebaseOtp } from "@/lib/firebase/phoneAuth";
import type { ConfirmationResult } from "firebase/auth";

export default function TenantLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setToastNotice(null);

    const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    if (clean.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setSending(true);
      const confirmation = await sendFirebaseOtp(clean, "tenant-recaptcha-container");
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setToastNotice(`SMS verification OTP sent via Firebase to +91 ${clean}.`);
    } catch (err: any) {
      console.error("Firebase send OTP error:", err);
      let msg = err?.message || "Failed to send verification SMS.";
      if (err?.code === "auth/invalid-phone-number") {
        msg = "The phone number format is invalid.";
      } else if (err?.code === "auth/quota-exceeded") {
        msg = "Firebase SMS daily quota exceeded.";
      } else if (err?.code === "auth/unauthorized-domain") {
        msg = "Domain not authorized in Firebase Console (Authentication -> Settings -> Authorized domains).";
      }
      setErrorMessage(msg);
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

    if (!confirmationResult) {
      setErrorMessage("No active OTP session. Please request a new verification code.");
      setOtpSent(false);
      return;
    }

    try {
      setVerifying(true);
      // 1. Confirm code with Firebase Auth
      const { idToken } = await confirmFirebaseOtp(confirmationResult, otp);

      // 2. Pass verified idToken to backend to confirm tenancy status
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, idToken, otp }),
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
    } catch (err: any) {
      console.error("Firebase OTP verification error:", err);
      let msg = err?.message || "Invalid OTP code.";
      if (err?.code === "auth/invalid-verification-code") {
        msg = "Incorrect OTP code. Please check the SMS and enter the 6 digits.";
      } else if (err?.code === "auth/code-expired") {
        msg = "This verification code has expired. Please request a new one.";
      }
      setErrorMessage(msg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#072e18]">
      <Navbar />

      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="tenant-recaptcha-container"></div>

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
            <p className="text-xs text-gray-300">
              Log in with your registered mobile number using Firebase SMS OTP.
            </p>
          </div>

          {/* Toast Notice */}
          {toastNotice && (
            <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-3.5 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{toastNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl bg-rose-500/20 border border-rose-500/40 p-3.5 text-xs text-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Main Form Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-3xl space-y-5 shadow-2xl">
            {!otpSent ? (
              /* Step 1: Enter Phone Number */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm text-emerald-300 font-bold font-mono">
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
                  <p className="text-[11px] text-gray-300 mt-1">
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
                      <span>Sending Firebase OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Firebase OTP</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">
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
                  <label className="block text-xs font-medium text-gray-200 mb-1.5">
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
                      placeholder="Enter 6-digit OTP"
                      className="w-full rounded-xl bg-gray-900/90 border border-emerald-500/50 pl-10 pr-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-gray-300">
                      Enter the 6-digit code received on your phone.
                    </p>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => handleSendOtp()}
                      className="text-[11px] font-bold text-amber-400 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Resend SMS</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Firebase OTP...</span>
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
