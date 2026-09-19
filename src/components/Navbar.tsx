"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  DoorOpen,
  LayoutDashboard,
  LogIn,
  PlusCircle,
  Menu,
  X,
  UserCheck,
  LogOut,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<{
    role?: string;
    name?: string;
    phone?: string;
    user?: { name?: string; phone?: string; pgName?: string };
  } | null>(null);

  useEffect(() => {
    const loadSession = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("pgm_session");
        if (saved) {
          try {
            setSession(JSON.parse(saved));
          } catch {
            // ignore
          }
        }
      }
    };
    loadSession();
    window.addEventListener("storage", loadSession);
    return () => window.removeEventListener("storage", loadSession);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("pgm_session");
    setSession(null);
    window.location.href = "/";
  };

  const displayName =
    session?.name ||
    session?.user?.name ||
    (session?.role === "owner" ? "Owner" : session?.role === "admin" ? "Super Admin" : "Resident");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#dceadc] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand: PGM */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="PGM Logo"
              className="h-10 w-10 rounded-full object-contain shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="text-xl font-display font-black tracking-tight text-[#07361b]">
                PGM
              </span>
              <p className="text-[10px] text-[#33613b] -mt-1 hidden sm:block font-medium">Smart PG Management & Rental Directory</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
          <Link
            href="/"
            className={`px-3.5 py-2 rounded-full transition-colors ${
              pathname === "/"
                ? "text-[#07361b] font-bold bg-[#e3f0e6]"
                : "text-[#24452c] hover:text-[#07361b] hover:bg-[#edf6ee]"
            }`}
          >
            Explore PGs & Vacancies
          </Link>

          {session?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname === "/admin/dashboard"
                  ? "bg-[#07361b] text-white shadow-xs"
                  : "text-[#07361b] bg-[#dcf2e1] border border-[#bce6c5] hover:bg-[#c8e4ce]"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#ff6b00]" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          {session?.role === "owner" && (
            <div className="flex items-center gap-1 bg-[#edf6ee] p-1 rounded-full border border-[#d6e8da]">
              <Link
                href="/owner/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  pathname === "/owner/dashboard"
                    ? "bg-[#07361b] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <Link
                href="/owner/rooms"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  pathname === "/owner/rooms"
                    ? "bg-[#07361b] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <DoorOpen className="h-3.5 w-3.5" />
                Rooms
              </Link>
              <Link
                href="/owner/tenants"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  pathname === "/owner/tenants"
                    ? "bg-[#07361b] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Tenants
              </Link>
            </div>
          )}

          {session?.role === "tenant" && (
            <Link
              href={`/tenant/dashboard?phone=${session.phone}`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[#07361b] bg-[#dcf2e1] border border-[#bce6c5] text-xs font-bold hover:bg-[#cef0d5] transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#1e7c3b]" />
              Resident Portal
            </Link>
          )}

          {!session && (
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#07361b] bg-[#e3f0e6] hover:bg-[#d5ebd9] border border-[#c8e4ce] transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#1e7c3b]" />
              Register Your PG
            </Link>
          )}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#24452c] hidden sm:inline font-medium">
                Hi, <strong className="text-[#07361b]">{displayName}</strong>{session.role ? ` (${session.role})` : ""}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#d6e8da] text-xs font-semibold text-[#24452c] hover:text-[#07361b] hover:bg-[#edf6ee] transition-colors"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 hover:shadow-lg hover:shadow-[#ff6b00]/35 transition-all active:scale-98"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login</span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#07361b] hover:bg-[#edf6ee]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#dceadc] bg-white px-4 pt-2 pb-4 space-y-2 text-sm font-semibold">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-[#07361b] hover:bg-[#edf6ee]"
          >
            Explore PGs & Vacancies
          </Link>

          {session?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-[#07361b] font-bold bg-[#dcf2e1] hover:bg-[#c8e4ce]"
            >
              Admin Dashboard
            </Link>
          )}

          {session?.role === "owner" && (
            <>
              <Link
                href="/owner/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-[#07361b] hover:bg-[#edf6ee]"
              >
                Owner Dashboard
              </Link>
              <Link
                href="/owner/rooms"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-[#07361b] hover:bg-[#edf6ee]"
              >
                Rooms & Pricing
              </Link>
              <Link
                href="/owner/tenants"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-[#07361b] hover:bg-[#edf6ee]"
              >
                Tenants & Vacating Ratings
              </Link>
            </>
          )}

          {session?.role === "tenant" && (
            <Link
              href={`/tenant/dashboard?phone=${session.phone}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-[#07361b] bg-[#dcf2e1]"
            >
              Resident Portal
            </Link>
          )}

          {!session && (
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-[#07361b] hover:bg-[#edf6ee]"
            >
              Register Your PG
            </Link>
          )}

          {!session && (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-full text-center bg-[#ff6b00] text-white font-bold"
            >
              Login (Phone OTP)
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
