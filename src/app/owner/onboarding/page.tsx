"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  KeyRound,
  ArrowRight,
  CheckCircle,
  Loader2,
  Zap,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    pgName: "",
    address: "",
    city: "",
    pincode: "",
    gstin: "",
    ebRatePerUnit: "15",
    razorpayKeyId: "",
    razorpayKeySecret: "",
  });

  useEffect(() => {
    fetch("/api/owner/onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pg) {
          setForm({
            pgName: data.pg.pgName || "",
            address: data.pg.location?.address || "",
            city: data.pg.location?.city || "",
            pincode: data.pg.location?.pincode || "",
            gstin: data.pg.gstin || "",
            ebRatePerUnit: data.pg.ebRatePerUnit ? String(data.pg.ebRatePerUnit) : "15",
            razorpayKeyId: data.pg.razorpay?.keyId || "",
            razorpayKeySecret: data.pg.razorpay?.keySecret || "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/owner/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgName: form.pgName,
          location: {
            address: form.address,
            city: form.city,
            pincode: form.pincode,
          },
          gstin: form.gstin,
          ebRatePerUnit: Number(form.ebRatePerUnit) || 15,
          razorpayKeyId: form.razorpayKeyId,
          razorpayKeySecret: form.razorpayKeySecret,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/owner/dashboard");
        }, 1200);
      } else {
        alert(data.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#bce6c5] bg-[#dcf2e1] px-3.5 py-1 text-xs font-bold text-[#07361b] mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#ff6b00]" />
            Property Settings
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-[#07361b]">Configure PG Profile</h1>
          <p className="text-xs text-[#33613b] mt-1">
            Update your property listing, location, EB rate, and payment gateway keys.
          </p>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-[#d8ebd9] shadow-xs flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#07361b] animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d8ebd9] shadow-xs space-y-4">
              <h2 className="text-base font-black text-[#07361b] flex items-center gap-2 border-b border-[#e2efe4] pb-2">
                <Building2 className="h-5 w-5 text-[#1e7c3b]" />
                Property Identity
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                    PG / Hostel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.pgName}
                    onChange={(e) => setForm({ ...form, pgName: e.target.value })}
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d8ebd9] shadow-xs space-y-4">
              <h2 className="text-base font-black text-[#07361b] flex items-center gap-2 border-b border-[#e2efe4] pb-2">
                <MapPin className="h-5 w-5 text-[#1e7c3b]" />
                Location & City
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                    Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#07361b] mb-1.5">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#07361b] mb-1.5">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d8ebd9] shadow-xs space-y-4">
              <h2 className="text-base font-black text-[#07361b] flex items-center gap-2 border-b border-[#e2efe4] pb-2">
                <Zap className="h-5 w-5 text-[#ff6b00]" />
                Electricity (EB) Default Rate
              </h2>

              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                  Default Rate per Unit (₹ / Unit)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#51a162]">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    placeholder="15"
                    value={form.ebRatePerUnit}
                    onChange={(e) => setForm({ ...form, ebRatePerUnit: e.target.value })}
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-8 pr-4 py-2.5 text-sm text-[#07361b] font-medium focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>
                <p className="text-xs text-[#33613b] mt-2 leading-relaxed">
                  When you take room meter readings (e.g. 400 units), the bill will auto-calculate at this rate (400 × ₹{form.ebRatePerUnit || "15"} = ₹{(400 * (Number(form.ebRatePerUnit) || 15)).toLocaleString("en-IN")}) and divide equally among all staying residents in the room.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d8ebd9] shadow-xs space-y-4">
              <h2 className="text-base font-black text-[#07361b] flex items-center gap-2 border-b border-[#e2efe4] pb-2">
                <KeyRound className="h-5 w-5 text-[#1e7c3b]" />
                Razorpay API Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={form.razorpayKeyId}
                    onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })}
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">
                    Razorpay Key Secret (Private)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={form.razorpayKeySecret}
                    onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value })}
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-4 py-2.5 text-sm text-[#07361b] font-mono focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-7 py-3 text-sm font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all disabled:opacity-50 active:scale-98"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-100" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <span>Save Changes</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
