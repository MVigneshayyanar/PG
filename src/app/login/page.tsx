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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    if (clean.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setOtpSent(true);
    setToastMessage(`OTP sent to +91 ${clean}. Please enter the verification code.`);
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    if (!otp || otp.length < 6) {
      setErrorMessage("Invalid OTP. Please enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, otp }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem(
          "pgm_session",
          JSON.stringify({
            role: data.role,
            name: data.user?.name || (data.role === "owner" ? "Owner" : "Resident"),
            user: data.user,
            phone: clean,
            token: data.token,
          })
        );
        router.push(data.redirect);
      } else {
        setErrorMessage(data.error || "Authentication failed.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Network error during login.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
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
              Enter your registered mobile number. The system will automatically direct you to your Owner or Resident dashboard.
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
            <div className={`rounded-2xl p-4 text-xs flex flex-col gap-2.5 ${
              errorMessage.includes("6381347842") || errorMessage.includes("not approved yet")
                ? "bg-amber-50 border border-amber-200 text-amber-950"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
                  errorMessage.includes("6381347842") ? "text-amber-600" : "text-rose-600"
                }`} />
                <div className="leading-relaxed">
                  {errorMessage.includes("6381347842") && (
                    <p className="font-bold text-amber-900 mb-0.5">Verification Required</p>
                  )}
                  <p>{errorMessage}</p>
                </div>
              </div>

              {errorMessage.includes("6381347842") && (
                <a
                  href="tel:6381347842"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07361b] hover:bg-[#052814] text-white px-4 py-2.5 font-bold transition-colors w-full text-center shadow-xs"
                >
                  <PhoneCall className="h-4 w-4 text-[#ff6b00]" />
                  <span>Call Admin: 6381347842</span>
                </a>
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
                    We will send a verification OTP to your registered number.
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
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Phone</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyLogin} className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#33613b]">
                    OTP sent to <span className="font-mono font-bold text-[#07361b]">+91 {phoneNumber}</span>
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
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full rounded-2xl border border-[#c8e4ce] bg-[#f8fbf8] pl-12 pr-4 py-2.5 text-sm font-mono tracking-widest text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#51a162] mt-1.5">
                    Enter the 6-digit OTP sent to your mobile number.
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
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Enter Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
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
