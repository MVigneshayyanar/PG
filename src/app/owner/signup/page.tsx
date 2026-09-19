"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function OwnerSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("userRole", "owner");
      localStorage.setItem("ownerPhone", "9876543200");
      localStorage.setItem("ownerName", name || "Demo Owner");
      localStorage.setItem("pgName", "Sri Sai Luxury PG & Coliving");
      localStorage.setItem("currentPgId", "pg-sri-sai-hsr");
      router.push("/owner/onboarding");
    }, 600);
  };

  const handleQuickDemo = () => {
    localStorage.setItem("userRole", "owner");
    localStorage.setItem("ownerPhone", "9876543200");
    localStorage.setItem("ownerName", "Ramesh Sharma");
    localStorage.setItem("pgName", "Sri Sai Luxury PG & Coliving");
    localStorage.setItem("currentPgId", "pg-sri-sai-hsr");
    router.push("/owner/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5]">
              <Building2 className="h-6 w-6 text-[#1e7c3b]" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">Create Owner Account</h1>
            <p className="text-xs text-[#33613b]">
              Sign up to list and start managing your PG property
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d8ebd9] shadow-xs space-y-5">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-[#51a162]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-10 pr-4 py-2.5 text-sm text-[#07361b] placeholder-[#6b9474] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#51a162]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@property.com"
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-10 pr-4 py-2.5 text-sm text-[#07361b] placeholder-[#6b9474] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#51a162]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-10 pr-4 py-2.5 text-sm text-[#07361b] placeholder-[#6b9474] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] py-3 text-sm font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all disabled:opacity-50 active:scale-98"
              >
                <span>{loading ? "Creating Account..." : "Continue to PG Onboarding"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#e2efe4] w-full" />
              <span className="bg-white px-3 text-[11px] text-[#51a162] uppercase tracking-wider shrink-0 font-bold">
                or quick start
              </span>
              <div className="border-t border-[#e2efe4] w-full" />
            </div>

            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-[#bce6c5] bg-[#dcf2e1] hover:bg-[#cbebd1] py-2.5 text-xs font-bold text-[#07361b] transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-[#1e7c3b]" />
              <span>Instant Demo Owner (Skip Form)</span>
            </button>

            <p className="text-center text-xs text-[#33613b]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#ff6b00] hover:underline font-bold">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
