"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Lock, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("userRole", "owner");
      localStorage.setItem("ownerPhone", "9876543200");
      localStorage.setItem("ownerName", "Ramesh Sharma");
      localStorage.setItem("pgName", "Sri Sai Luxury PG & Coliving");
      localStorage.setItem("currentPgId", "pg-sri-sai-hsr");
      router.push("/owner/dashboard");
    }, 600);
  };

  const handleDemoFill = () => {
    setEmail("owner@srisai.com");
    setPassword("demo1234");
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
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">Owner Login</h1>
            <p className="text-xs text-[#33613b]">
              Sign in with phone OTP or credentials to access your PG dashboard
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d8ebd9] shadow-xs space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#51a162]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@srisai.com"
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
                <span>{loading ? "Signing in..." : "Access Owner Dashboard"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick autofill helper */}
            <div className="rounded-2xl bg-[#edf6ee] border border-[#d0e8d5] p-3 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#07361b]">Need Demo Credentials?</span>
                <p className="text-[11px] text-[#33613b]">Auto-fill test email & password</p>
              </div>
              <button
                type="button"
                onClick={handleDemoFill}
                className="flex items-center gap-1 rounded-full bg-[#dcf2e1] hover:bg-[#c9ebd0] border border-[#bce6c5] px-3 py-1.5 font-bold text-[#07361b] text-xs transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#ff6b00]" />
                Fill Demo
              </button>
            </div>

            <div className="pt-2 text-center space-y-1.5 text-xs text-[#33613b]">
              <p>
                Want phone OTP login instead?{" "}
                <Link href="/login" className="text-[#ff6b00] font-bold hover:underline">
                  Quick OTP Login
                </Link>
              </p>
              <p>
                New property owner?{" "}
                <Link href="/register" className="text-[#ff6b00] font-bold hover:underline">
                  Register PG
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
