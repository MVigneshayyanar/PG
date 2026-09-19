"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { sendFirebaseOtp, confirmFirebaseOtp } from "@/lib/firebase/phoneAuth";
import type { ConfirmationResult } from "firebase/auth";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Direct login for admins or fallback when Firebase SMS hits rate limits
  const handleDirectLogin = async (phoneToUse?: string, bypassOtp = "123456") => {
    const clean = (phoneToUse || phoneNumber).replace(/[^0-9]/g, "").slice(-10);
    if (!clean || clean.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, otp: bypassOtp }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Unable to connect to server. Please try again.");
      }

      if (data.success) {
        localStorage.setItem(
          "pgm_session",
          JSON.stringify({
            role: data.role,
            name: data.user?.name || (data.role === "admin" ? "Super Admin" : data.role === "owner" ? "Owner" : "Resident"),
            user: data.user,
            phone: clean,
            token: data.token,
          })
        );

        setToastMessage(`Authenticated! Redirecting to ${data.role.toUpperCase()} dashboard...`);
        setTimeout(() => {
          router.push(data.redirect || "/");
        }, 500);
      } else {
        setErrorMessage(data.error || "Authentication failed");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setToastMessage(null);

    const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    if (clean.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Super Admin fast-track if desired
    if (clean === "9626855406" || clean === "6381347842") {
      // Still try Firebase SMS, but if it fails, fallback gracefully
    }

    try {
      setLoading(true);
      const confirmation = await sendFirebaseOtp(clean, "recaptcha-container");
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setToastMessage(`SMS verification code sent to +91 ${clean} via Firebase.`);
    } catch (err: any) {
      console.error("Firebase Phone Auth error:", err);
      let msg = err?.message || "Failed to dispatch verification code via SMS.";
      
      if (err?.code === "auth/invalid-phone-number") {
        msg = "The phone number format is invalid. Please check the digits.";
      } else if (err?.code === "auth/invalid-app-credential") {
        msg = "App Credential Error: Please ensure your domain is in Firebase Console -> Authentication -> Settings -> Authorized Domains.";
      } else if (err?.code === "auth/operation-not-allowed") {
        msg = "SMS Region Blocked: In Firebase Console -> Authentication -> Settings -> SMS Region Policy, allow India (+91).";
      } else if (err?.code === "auth/quota-exceeded") {
        msg = "SMS daily quota reached. Use your test code or click Direct Sign-in below.";
      } else if (err?.code === "auth/unauthorized-domain") {
        msg = "This domain is not authorized in Firebase Console.";
      } else if (err?.code === "auth/too-many-requests") {
        msg = "Firebase SMS rate limit reached on this IP. Click 'Instant Sign-In' below to enter directly!";
      }

      setErrorMessage(msg);

      // If it is an Admin number or rate-limited, allow moving forward to the OTP / direct login screen
      if (clean === "9626855406" || clean === "6381347842" || err?.code === "auth/too-many-requests") {
        setOtpSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    const enteredOtp = otp.trim() || "123456";

    // If confirmationResult exists, verify with Firebase Auth
    if (confirmationResult) {
      try {
        setLoading(true);
        const { idToken } = await confirmFirebaseOtp(confirmationResult, enteredOtp);

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: clean, idToken, otp: enteredOtp }),
        });

        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response from server. Please try again.");
        }

        if (data.success) {
          localStorage.setItem(
            "pgm_session",
            JSON.stringify({
              role: data.role,
              name: data.user?.name || (data.role === "admin" ? "Super Admin" : "User"),
              user: data.user,
              phone: clean,
              token: data.token,
            })
          );

          setToastMessage(`Verified! Redirecting to ${data.role.toUpperCase()} dashboard...`);
          setTimeout(() => {
            router.push(data.redirect || "/");
          }, 500);
          return;
        } else {
          setErrorMessage(data.error || "Authentication failed");
        }
      } catch (err: any) {
        console.warn("Firebase OTP confirmation error, attempting server fallback:", err);
        // If Firebase verification failed but it's an admin/registered account, fall back to direct verification
        if (clean === "9626855406" || clean === "6381347842") {
          await handleDirectLogin(clean, enteredOtp);
          return;
        }
        setErrorMessage(err?.message || "Invalid OTP code.");
      } finally {
        setLoading(false);
      }
    } else {
      // Direct server verification (when Firebase SMS was rate-limited)
      await handleDirectLogin(clean, enteredOtp);
    }
  };

  const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
  const isAdminNumber = clean === "9626855406" || clean === "6381347842";

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <img
              src="/logo.png"
              alt="PGM"
              className="mx-auto h-16 w-16 rounded-full object-contain shadow-md shadow-[#07361b]/15"
            />
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">
              Unified Portal Login
            </h1>
            <p className="text-xs text-[#33613b]">
              Enter your registered mobile number to access your Owner, Resident, or Admin dashboard.
            </p>
          </div>

          {/* Feedback messages */}
          {toastMessage && (
            <div className="rounded-2xl bg-[#dcf2e1] border border-[#bce6c5] p-3.5 text-xs text-[#07361b] font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#1e7c3b] shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              className={`rounded-2xl p-4 text-xs flex flex-col gap-2.5 ${
                errorMessage.includes("6381347842") || errorMessage.includes("not approved yet") || errorMessage.includes("not part of any PG") || errorMessage.includes("rate limit")
                  ? "bg-amber-50 border border-amber-200 text-amber-950"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className={`h-5 w-5 shrink-0 mt-0.5 ${
                    errorMessage.includes("6381347842") || errorMessage.includes("not part of any PG") || errorMessage.includes("rate limit")
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                />
                <div className="leading-relaxed">
                  {errorMessage.includes("not part of any PG") && (
                    <p className="font-bold text-amber-900 mb-0.5">Not Registered</p>
                  )}
                  {errorMessage.includes("rate limit") && (
                    <p className="font-bold text-amber-900 mb-0.5">Firebase Rate Limit Active</p>
                  )}
                  <p>{errorMessage}</p>
                </div>
              </div>

              {errorMessage.includes("not part of any PG") && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-white px-4 py-2.5 font-bold transition-colors w-full text-center shadow-xs"
                >
                  <span>Register Your PG Property</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              {/* Instant bypass button for Admin or rate-limited users */}
              {(isAdminNumber || errorMessage.includes("rate limit") || errorMessage.includes("Too many attempts")) && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDirectLogin(clean || "9626855406")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07361b] hover:bg-[#052814] text-white px-4 py-2.5 font-bold transition-colors w-full text-center shadow-xs"
                >
                  <ShieldCheck className="h-4 w-4 text-[#ff6b00]" />
                  <span>Instant Sign-In as Admin (Bypass Cooldown)</span>
                </button>
              )}
            </div>
          )}

          {/* White Card */}
          <div className="bg-white rounded-3xl border border-[#d8ebd9] p-6 sm:p-8 shadow-xs space-y-5">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm font-bold font-mono text-[#51a162]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-2xl border border-[#c8e4ce] bg-[#f8fbf8] pl-14 pr-4 py-2.5 text-sm font-mono text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#51a162] mt-1.5">
                    We will send an SMS verification OTP to your registered phone.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#07361b] hover:bg-[#052814] py-3 text-sm font-bold text-white shadow-md shadow-[#07361b]/20 transition-all disabled:opacity-50 active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Phone...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Phone</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Instant 1-click Admin Access for Super Admin numbers */}
                {isAdminNumber && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDirectLogin(clean)}
                    className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-[#07361b] bg-transparent hover:bg-[#07361b]/5 py-2.5 text-xs font-black text-[#07361b] transition-all"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#ff6b00]" />
                    <span>Instant Admin Sign-In (No OTP Required)</span>
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleVerifyLogin} className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#33613b]">
                    Phone:{" "}
                    <span className="font-mono font-bold text-[#07361b]">
                      +91 {phoneNumber}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="text-[#ff6b00] font-bold hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                    Enter Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-3 h-4 w-4 text-[#51a162]" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit OTP (e.g. 123456)"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full rounded-2xl border border-[#c8e4ce] bg-[#f8fbf8] pl-12 pr-4 py-2.5 text-sm font-mono tracking-widest text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[11px] text-[#51a162]">
                      Enter the OTP or your test code (123456).
                    </p>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSendOtp()}
                      className="text-[11px] font-bold text-[#ff6b00] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Resend</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#07361b] hover:bg-[#052814] py-3 text-sm font-bold text-white shadow-md shadow-[#07361b]/20 transition-all disabled:opacity-50 active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Enter Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {isAdminNumber && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDirectLogin(clean)}
                    className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-[#07361b] bg-transparent hover:bg-[#07361b]/5 py-2.5 text-xs font-black text-[#07361b] transition-all"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#ff6b00]" />
                    <span>Instant Admin Sign-In</span>
                  </button>
                )}
              </form>
            )}

            {/* Registration note */}
            <div className="pt-2 text-center text-xs text-[#33613b] space-y-1">
              <p>
                Are you a PG Owner?{" "}
                <Link href="/register" className="text-[#ff6b00] font-bold hover:underline">
                  Register your PG property
                </Link>
              </p>
              <p className="text-[11px] text-[#6b9474]">
                Note: Tenants cannot register independently. Your PG owner must enroll your phone number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
