"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DoorOpen,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Plus,
  Receipt,
  LogOut,
  Calendar,
  X,
  Loader2,
  Send,
  Building2,
  Phone,
  
  ShieldCheck,
  User,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RazorpayModal } from "@/components/RazorpayModal";
import { Tenant, Room, Payment, Ticket, TicketCategory } from "@/types";

function TenantDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams?.get("phone");

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [pg, setPg] = useState<{ id: string; pgName: string; location: any } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Payment Modal State
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);

  // Ticket Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    category: "Maintenance" as TicketCategory,
  });

  const fetchTenantData = async (phone: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenant/me?phone=${phone}`);
      const data = await res.json();

      if (data.success && data.tenant && data.tenant.active !== false) {
        setTenant(data.tenant);
        setPg(data.pg);
        setPayments(data.payments || []);
        setTickets(data.tickets || []);
      } else {
        // If vacated or not found
        alert("Tenant account not found or deactivated. Please check with your PG owner.");
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let targetPhone = phoneParam;
    if (!targetPhone && typeof window !== "undefined") {
      const stored = localStorage.getItem("pgm_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          targetPhone = parsed.phone || parsed.user?.phone;
        } catch {
          // ignore
        }
      }
    }

    targetPhone = targetPhone || "9876543211";
    fetchTenantData(targetPhone);
  }, [phoneParam]);

  useEffect(() => {
    if (showTicketModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showTicketModal]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      setSubmittingTicket(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          tenantName: tenant.name,
          phoneNumber: tenant.phoneNumber,
          pgId: tenant.pgId,
          roomId: tenant.roomId,
          roomNumber: tenant.roomNumber,
          title: ticketForm.title,
          description: ticketForm.description,
          category: ticketForm.category,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowTicketModal(false);
        setTicketForm({ title: "", description: "", category: "Maintenance" });
        setTickets([data.ticket, ...tickets]);
      } else {
        alert(data.error || "Failed to create ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting ticket");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handlePaymentSuccess = (updatedPayment: Payment) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );
    setPayingPayment(null);
  };

  const currentMonthPayment =
    payments.find((p) => p.month === "2026-09") || payments[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#1e7c3b] animate-spin" />
            <p className="text-xs text-[#33613b] font-medium">Loading resident account...</p>
          </div>
        ) : !tenant ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#d8ebd9] shadow-xs space-y-3">
            <p className="text-[#07361b] font-bold">Resident account not found or has been vacated.</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-full bg-[#ff6b00] text-white text-xs font-bold shadow-md shadow-[#ff6b00]/25"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {/* Resident Profile Banner */}
            <div className="bg-white p-6 rounded-3xl border border-[#d8ebd9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-black text-[#07361b]">
                    Welcome, {tenant.name}
                  </h1>
                </div>
                <p className="text-xs text-[#33613b] mt-1 flex items-center gap-1.5 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-[#1e7c3b]" />
                  <span className="font-bold text-[#07361b]">{pg?.pgName}</span>
                  <span>•</span>
                  <span>{pg?.location?.address}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[#07361b] hover:bg-[#0f4523] text-white px-4 py-2 text-xs font-bold shadow-xs transition-all"
                >
                  <Wrench className="h-3.5 w-3.5 text-[#ff6b00]" />
                  <span>Raise Complaint</span>
                </button>

                <Link
                  href="/login"
                  className="flex items-center gap-1 rounded-full border border-[#d6e8da] bg-[#f4f9f5] hover:bg-[#eaf4ec] px-3.5 py-2 text-xs font-bold text-[#07361b] transition-colors"
                  title="Switch User"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Room Details & Dues Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Room Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Allocated Room
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-[#1e7c3b]" />
                  Room {tenant.roomNumber}
                </div>
                <p className="text-xs font-bold text-[#07361b]">
                  {tenant.sharingCategory ? `${tenant.sharingCategory}-Sharing` : "Standard Room"}
                </p>
              </div>

              {/* Monthly Rent */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Monthly Rent
                </span>
                <div className="text-2xl font-black text-slate-900">
                  ₹{tenant.rentAmount?.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-slate-500">Per bed per month</p>
              </div>

              {/* Contact / Phone */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Verified Mobile
                </span>
                <div className="text-lg font-black text-slate-900 font-mono flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  +91 {tenant.phoneNumber}
                </div>
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Mapped Tenant
                </p>
              </div>
            </div>

            {/* Rent Dues & Razorpay Pay Now Card */}
            {currentMonthPayment && (
              <div
                className={`p-6 rounded-3xl border shadow-sm transition-all ${
                  currentMonthPayment.status === "paid"
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-white border-rose-200 shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Billing Month: {currentMonthPayment.month}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          currentMonthPayment.status === "paid"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-rose-100 text-rose-800 border-rose-200 animate-pulse"
                        }`}
                      >
                        {currentMonthPayment.status === "paid" ? "PAID" : "DUE / PENDING"}
                      </span>
                    </div>

                    <div className="text-3xl font-black text-slate-900">
                      ₹{currentMonthPayment.amount.toLocaleString("en-IN")}
                    </div>

                    {/* Itemized Rent & EB Cost Split */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-semibold">Base Rent:</span>
                        <span className="font-black text-slate-900">
                          ₹{(currentMonthPayment.baseRent || tenant.rentAmount || currentMonthPayment.amount).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {currentMonthPayment.ebAmount ? (
                        <div className="flex items-center gap-1.5 text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold">
                          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
                          <span className="text-amber-700">EB Share:</span>
                          <span>+₹{currentMonthPayment.ebAmount.toLocaleString("en-IN")}</span>
                          {currentMonthPayment.ebUnits && (
                            <span className="text-[10px] text-amber-700/80 font-normal">
                              ({currentMonthPayment.ebUnits} room units @ ₹{currentMonthPayment.ebRate || 15}/u)
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-600 pt-1">
                      {currentMonthPayment.status === "paid"
                        ? `Paid on ${new Date(currentMonthPayment.paidAt || Date.now()).toLocaleDateString(
                            "en-IN"
                          )} • Ref: ${currentMonthPayment.razorpayPaymentId || "pay_verified"}`
                        : "Rent & electricity charges pending for this month. Pay securely using Razorpay standard checkout."}
                    </p>
                  </div>

                  {currentMonthPayment.status === "unpaid" ? (
                    <button
                      onClick={() => setPayingPayment(currentMonthPayment)}
                      className="flex items-center justify-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-7 py-3.5 text-sm font-black text-white shadow-md shadow-[#ff6b00]/25 active:scale-95 transition-all self-stretch sm:self-auto"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Pay Total Due (Razorpay)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#dcf2e1] text-[#07361b] text-xs font-bold border border-[#bce6c5]">
                      <CheckCircle2 className="h-4 w-4 text-[#1e7c3b]" />
                      <span>Dues Cleared!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#1e7c3b]" />
                Payment Records & History
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Billing Month</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.month}</td>
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-slate-900">
                            ₹{p.amount.toLocaleString("en-IN")}
                          </div>
                          {p.ebAmount ? (
                            <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              <Zap className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                              <span>Rent ₹{(p.baseRent || p.amount - p.ebAmount).toLocaleString("en-IN")} + EB ₹{p.ebAmount.toLocaleString("en-IN")}</span>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                          {p.razorpayPaymentId || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "Pending"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              p.status === "paid"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complaints / Tickets */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  My Complaints & Service Tickets
                </h3>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="text-xs text-[#ff6b00] font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Raise New Issue
                </button>
              </div>

              <div className="space-y-2.5">
                {tickets.length > 0 ? (
                  tickets.map((t) => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              t.status === "open"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {t.status.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {t.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                      <p className="text-xs text-slate-600">{t.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No active complaints filed.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Razorpay Dynamic Checkout Modal */}
      {payingPayment && (
        <RazorpayModal
          payment={payingPayment}
          pgName={pg?.pgName || "PG Accommodation"}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPayingPayment(null)}
        />
      )}

      {/* Raise Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 !m-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Submit Support Issue</h3>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Issue Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Maintenance", "Electrical", "Plumbing", "Other"] as TicketCategory[]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setTicketForm({ ...ticketForm, category: cat })}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            ticketForm.category === cat
                              ? "border-amber-600 bg-amber-50 text-amber-900"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Complaint Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bathroom tap leaking"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the issue in detail..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTicketModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="flex items-center gap-1.5 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all disabled:opacity-50 active:scale-98"
                  >
                    {submittingTicket ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Submit Complaint</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default function TenantDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <TenantDashboardContent />
    </Suspense>
  );
}
