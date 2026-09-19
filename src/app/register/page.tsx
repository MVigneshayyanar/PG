"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Zap,
  Sparkles,
  CreditCard,
  KeyRound,
  CheckCircle2,
  PhoneCall,
  ShieldAlert,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function RegisterPGPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<{
    pgName: string;
    ownerName: string;
    ownerPhone: string;
  } | null>(null);

  const [form, setForm] = useState({
    pgName: "",
    ownerName: "",
    ownerPhone: "",
    address: "",
    city: "Bengaluru",
    pincode: "",
    ebRatePerUnit: "15",
    gstin: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = form.ownerPhone.replace(/[^0-9]/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register-pg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ownerPhone: cleanPhone,
          ebRatePerUnit: Number(form.ebRatePerUnit) || 15,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedApp({
          pgName: form.pgName,
          ownerName: form.ownerName,
          ownerPhone: cleanPhone,
        });
      } else {
        setErrorMessage(data.error || "Failed to submit PG application");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error submitting application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-center">
        {submittedApp ? (
          /* Application Submitted Screen */
          <div className="bg-white rounded-3xl border border-[#bce6c5] p-6 sm:p-8 shadow-lg shadow-[#07361b]/5 text-center space-y-4 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#dcf2e1] text-[#07361b] flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-[#1e7c3b]" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                Application Under Verification
              </span>
              <h2 className="font-display text-2xl font-black text-[#07361b]">
                Registration Received!
              </h2>
              <p className="text-xs text-[#33613b] max-w-md mx-auto">
                Thank you, <span className="font-bold text-[#07361b]">{submittedApp.ownerName}</span>. Your application for{" "}
                <span className="font-bold text-[#07361b]">{submittedApp.pgName}</span> has been securely submitted to our Admin Team.
              </p>
            </div>

            <div className="bg-[#f8fbf8] border border-[#d8ebd9] rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-[#ff6b00] shrink-0 mt-0.5" />
                <div className="text-xs text-[#07361b] leading-relaxed">
                  <p className="font-bold mb-0.5">How property approval works:</p>
                  <p className="text-[#33613b]">
                    Our admin verifies property records. Once approved, your PG will be published in the live directory and you will be able to log in to the Owner Dashboard using your mobile number{" "}
                    <span className="font-mono font-bold text-[#07361b]">+91 {submittedApp.ownerPhone}</span>.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#e2efe4] pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-[#33613b]">
                  For urgent approval or queries, contact admin:
                </span>
                <a
                  href="tel:9626855406"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07361b] bg-[#dcf2e1] hover:bg-[#c8e4ce] px-3 py-1 rounded-lg transition-colors"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-[#1e7c3b]" />
                  <span>Call 9626855406</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2 rounded-full border border-[#c8e4ce] text-xs font-bold text-[#07361b] hover:bg-[#dcf2e1] transition-all text-center"
              >
                Back to Home Directory
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-5 py-2 rounded-full bg-[#07361b] hover:bg-[#052814] text-xs font-bold text-white shadow-sm transition-all text-center"
              >
                Go to Unified Login
              </Link>
            </div>
          </div>
        ) : (
          /* Compact No-Scroll Registration Form */
          <div className="space-y-3">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d8ebd9] pb-2.5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#bce6c5] bg-[#dcf2e1] px-2.5 py-0.5 text-[10px] font-bold text-[#07361b] mb-1">
                  <Sparkles className="h-3 w-3 text-[#ff6b00]" />
                  PG Owner Registration Application
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-black text-[#07361b] tracking-tight">
                  Register Your PG Property
                </h1>
              </div>
              <p className="text-[11px] text-[#33613b] sm:text-right max-w-sm leading-tight">
                Submit property details for Admin review. All details fit on a single screen for quick submission.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#d8ebd9] p-4 sm:p-5 shadow-xs space-y-4">
              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
                {/* LEFT COLUMN: Property & Owner Identity & Location */}
                <div className="space-y-3">
                  {/* Property Info */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#07361b] flex items-center gap-1.5 border-b border-[#e2efe4] pb-1">
                      <Building2 className="h-3.5 w-3.5 text-[#1e7c3b]" />
                      Property Identity
                    </h3>

                    <div>
                      <label className="block text-[11px] font-bold text-[#07361b] mb-1">
                        PG / Hostel / Coliving Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sri Sai Luxury PG for Gents"
                        value={form.pgName}
                        onChange={(e) => setForm({ ...form, pgName: e.target.value })}
                        className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Owner Credentials */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#07361b] flex items-center gap-1.5 border-b border-[#e2efe4] pb-1">
                      <User className="h-3.5 w-3.5 text-[#1e7c3b]" />
                      Owner Credentials
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#07361b] mb-1">
                          Owner Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ramesh Sharma"
                          value={form.ownerName}
                          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                          className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#07361b] mb-1">
                          Owner Mobile (Login ID) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-[#51a162]">+91</span>
                          <input
                            type="tel"
                            required
                            pattern="[0-9]{10}"
                            maxLength={10}
                            placeholder="9876543200"
                            value={form.ownerPhone}
                            onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                            className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-10 pr-3 py-2 text-xs text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#07361b] flex items-center gap-1.5 border-b border-[#e2efe4] pb-1">
                      <MapPin className="h-3.5 w-3.5 text-[#1e7c3b]" />
                      Location & Address
                    </h3>

                    <div>
                      <label className="block text-[11px] font-bold text-[#07361b] mb-1">
                        Street Address / Landmark *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Plot 42, 14th Main, Sector 4, HSR Layout"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#07361b] mb-1">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="Bengaluru"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#07361b] mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          placeholder="560102"
                          value={form.pincode}
                          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                          className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: EB Billing, Razorpay, GSTIN & Actions */}
                <div className="space-y-3">
                  {/* Electricity (EB) Charges Settings */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#07361b] flex items-center gap-1.5 border-b border-[#e2efe4] pb-1">
                      <Zap className="h-3.5 w-3.5 text-[#ff6b00]" />
                      Electricity (EB) Billing Policy
                    </h3>

                    <div>
                      <label className="block text-[11px] font-bold text-[#07361b] mb-1">
                        Default EB Rate (₹ / Unit)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-[#51a162]">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          step="0.5"
                          placeholder="15"
                          value={form.ebRatePerUnit}
                          onChange={(e) => setForm({ ...form, ebRatePerUnit: e.target.value })}
                          className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-7 pr-3 py-2 text-xs text-[#07361b] font-medium focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-[#51a162] mt-1">
                        Auto-splits room electricity units equally among staying room residents.
                      </p>
                    </div>
                  </div>

                  {/* Razorpay Integration (Optional) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-[#e2efe4] pb-1">
                      <h3 className="text-xs font-bold text-[#07361b] flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-[#1e7c3b]" />
                        Online Rent Collection (Razorpay)
                      </h3>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5]">
                        Optional
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#07361b] mb-1 flex items-center gap-1">
                          <KeyRound className="h-3 w-3 text-[#51a162]" />
                          Razorpay Key ID
                        </label>
                        <input
                          type="text"
                          placeholder="rzp_live_... or rzp_test_..."
                          value={form.razorpayKeyId}
                          onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })}
                          className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#07361b] mb-1 flex items-center gap-1">
                          <KeyRound className="h-3 w-3 text-[#51a162]" />
                          Razorpay Key Secret
                        </label>
                        <input
                          type="password"
                          placeholder="Enter Key Secret"
                          value={form.razorpayKeySecret}
                          onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value })}
                          className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GSTIN (Optional) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#07361b] mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="29AAAAA0000A1Z5"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                      className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-1 focus:ring-[#07361b]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Strip */}
              <div className="pt-2 border-t border-[#edf5ee] flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-[#33613b]">
                  Already have an approved PG?{" "}
                  <Link href="/login" className="text-[#ff6b00] font-bold hover:underline">
                    Login with phone
                  </Link>
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all disabled:opacity-50 active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit PG Application</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
