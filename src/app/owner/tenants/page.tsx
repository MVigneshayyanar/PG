"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  UserPlus,
  Phone,
  DoorOpen,
  Calendar,
  CheckCircle2,
  X,
  Loader2,
  ArrowLeft,
  Star,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  AlertCircle,
  History,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Tenant, Room, TenantHistory } from "@/types";

function TenantsManagerContent() {
  const searchParams = useSearchParams();
  const preselectedRoomId = searchParams?.get("roomId") || "";

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Tenant Modal
  const [showAddModal, setShowAddModal] = useState(Boolean(preselectedRoomId));
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    phoneNumber: "",
    roomId: preselectedRoomId,
  });

  // Cross-PG Background Check State
  const [checkingHistory, setCheckingHistory] = useState(false);
  const [historyResult, setHistoryResult] = useState<{
    found: boolean;
    records: TenantHistory[];
    hasBlackmark: boolean;
    averageRating: string | null;
  } | null>(null);

  // Vacate Modal State
  const [vacatingTenant, setVacatingTenant] = useState<Tenant | null>(null);
  const [submittingVacate, setSubmittingVacate] = useState(false);
  const [vacateForm, setVacateForm] = useState({
    rating: 5,
    blackmark: false,
    comment: "",
  });

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showAddModal || vacatingTenant) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddModal, vacatingTenant]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, rRes] = await Promise.all([fetch("/api/tenants"), fetch("/api/rooms")]);
      const tData = await tRes.json();
      const rData = await rRes.json();

      if (tData.success) setTenants(tData.tenants);
      if (rData.success) {
        setRooms(rData.rooms);
        if (preselectedRoomId && !addForm.roomId) {
          setAddForm((f) => ({ ...f, roomId: preselectedRoomId }));
        } else if (!addForm.roomId && rData.rooms.length > 0) {
          setAddForm((f) => ({ ...f, roomId: rData.rooms[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedRoomId]);

  // Real-time Background Check when owner enters a 10-digit number
  useEffect(() => {
    const clean = addForm.phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    if (clean.length === 10) {
      setCheckingHistory(true);
      fetch(`/api/tenants/history-search?phone=${clean}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setHistoryResult(data);
          }
        })
        .catch(console.error)
        .finally(() => setCheckingHistory(false));
    } else {
      setHistoryResult(null);
    }
  }, [addForm.phoneNumber]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAdd(true);
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          phoneNumber: addForm.phoneNumber,
          roomId: addForm.roomId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddForm({ name: "", phoneNumber: "", roomId: rooms[0]?.id || "" });
        setHistoryResult(null);
        setToastMessage("Tenant enrolled! Their mobile number can now be used for login.");
        setTimeout(() => setToastMessage(null), 4000);
        await fetchData();
      } else {
        alert(data.error || "Failed to enroll tenant");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding tenant");
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleVacateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacatingTenant) return;

    try {
      setSubmittingVacate(true);
      const res = await fetch("/api/tenants/vacate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: vacatingTenant.id,
          rating: vacateForm.rating,
          blackmark: vacateForm.blackmark,
          comment: vacateForm.comment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVacatingTenant(null);
        setVacateForm({ rating: 5, blackmark: false, comment: "" });
        setToastMessage(`Tenant ${vacatingTenant.name} vacated. Login deactivated & rating saved.`);
        setTimeout(() => setToastMessage(null), 4000);
        await fetchData();
      } else {
        alert(data.error || "Failed to vacate tenant");
      }
    } catch (err) {
      console.error(err);
      alert("Error vacating tenant");
    } finally {
      setSubmittingVacate(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/owner/dashboard"
                className="text-xs font-bold text-[#ff6b00] hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#07361b] mt-1">
              Tenants & Room Assignments
            </h1>
            <p className="text-xs text-[#33613b]">
              Only enrolled active tenants can log in. When vacating, rate the tenant and flag blackmarks to protect other PG owners.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all self-start sm:self-auto active:scale-98"
          >
            <UserPlus className="h-4 w-4" />
            <span>Enroll New Resident</span>
          </button>
        </div>

        {toastMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Active Tenants Table */}
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-[#07361b] animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#d8ebd9] shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-[#edf5ee] text-left text-xs">
              <thead className="bg-[#f4f9f5] font-bold text-[#07361b]">
                <tr>
                  <th className="px-5 py-3.5">Tenant Name</th>
                  <th className="px-5 py-3.5">Mobile Phone (Login)</th>
                  <th className="px-5 py-3.5">Assigned Room</th>
                  <th className="px-5 py-3.5">Sharing Type</th>
                  <th className="px-5 py-3.5">Monthly Rent</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Vacate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f8fbf8] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{t.name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#1e7c3b]" />
                        +91 {t.phoneNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#edf6ee] font-mono font-bold text-[#07361b] text-[11px] border border-[#bce6c5]">
                        Room {t.roomNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {t.sharingCategory ? `${t.sharingCategory}-Sharing` : "Standard"}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ₹{t.rentAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{t.joinedAt}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setVacatingTenant(t);
                          setVacateForm({ rating: 5, blackmark: false, comment: "" });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Vacate & Rate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* 1. ADD TENANT MODAL WITH CROSS-PG BACKGROUND CHECK */}
      {showAddModal && (
        <div className="fixed inset-0 !m-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Enroll New Resident</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddTenant} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tenant Mobile Number (10 Digits) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-mono font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="9876543299"
                      value={addForm.phoneNumber}
                      onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-14 pr-4 py-2.5 text-sm text-slate-900 font-mono focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
                    />
                  </div>
                </div>

                {/* Real-time Background Check Box */}
                {checkingHistory && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#07361b]" />
                    <span>Searching PGM central tenant verification records...</span>
                  </div>
                )}

                {historyResult && historyResult.found && (
                  <div
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      historyResult.hasBlackmark
                        ? "bg-rose-50 border-rose-300 text-rose-900"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {historyResult.hasBlackmark ? (
                          <>
                            <ShieldAlert className="h-4 w-4 text-rose-600" />
                            <span className="text-rose-700 uppercase tracking-wide">
                              ⚠️ BLACKMARK WARNING ON THIS NUMBER
                            </span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <span className="text-emerald-700 uppercase tracking-wide">
                              Clean Record • Verified Previous Resident
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold bg-white px-2 py-0.5 rounded shadow-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>Rating: {historyResult.averageRating} / 5</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-semibold text-[11px] uppercase tracking-wider block opacity-75">
                        Past Rental History ({historyResult.records.length} stays):
                      </span>
                      {historyResult.records.map((rec) => (
                        <div key={rec.id} className="p-2.5 bg-white/90 rounded-xl border border-slate-200 space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{rec.pgName} (Room {rec.roomNumber})</span>
                            <span className="text-[11px] text-slate-500">{rec.joinedAt} ➔ {rec.vacatedAt}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600 font-bold">⭐ {rec.rating}/5</span>
                            {rec.blackmark && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                                Blackmark Flagged
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] italic">"{rec.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {historyResult && !historyResult.found && addForm.phoneNumber.length === 10 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>No previous vacating records found. Clean candidate.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tenant Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assign to Room *
                  </label>
                  <select
                    required
                    value={addForm.roomId}
                    onChange={(e) => setAddForm({ ...addForm, roomId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
                  >
                    <option value="" disabled>Select room</option>
                    {rooms.map((r) => {
                      const free = Math.max(0, r.capacity - (r.currentTenantsCount || 0));
                      return (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} ({r.category}-Share • ₹{r.rentAmount}/mo • {free} slots free)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="flex items-center gap-1.5 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all disabled:opacity-50 active:scale-98"
                  >
                    {submittingAdd ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span>Enroll & Enable Login</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* 2. VACATE & RATE MODAL */}
      {vacatingTenant && (
        <div className="fixed inset-0 !m-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Vacate Resident</h3>
                  <p className="text-xs text-slate-500">
                    Vacating <strong>{vacatingTenant.name}</strong> from Room {vacatingTenant.roomNumber}
                  </p>
                </div>
                <button
                  onClick={() => setVacatingTenant(null)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleVacateTenant} className="space-y-4">
                {/* 1 to 5 Star Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tenant Performance Rating (1 to 5 Stars) *
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setVacateForm({ ...vacateForm, rating: star })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= vacateForm.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-auto font-black text-sm text-slate-800">
                      {vacateForm.rating} of 5 Stars
                    </span>
                  </div>
                </div>

                {/* Blackmark Checkbox */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-rose-900">
                    <input
                      type="checkbox"
                      checked={vacateForm.blackmark}
                      onChange={(e) => setVacateForm({ ...vacateForm, blackmark: e.target.checked })}
                      className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Flag with Blackmark (Problematic / Defaulter)</span>
                  </label>
                  <p className="text-[11px] text-rose-700 pl-6">
                    If checked, other PG owners will be alerted if this person attempts to rent from their PG in future.
                  </p>
                </div>

                {/* Comment / Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Exit Feedback & Reasons *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Cleared all dues on time, left room tidy and peaceful. Or: Left without paying electricity bill..."
                    value={vacateForm.comment}
                    onChange={(e) => setVacateForm({ ...vacateForm, comment: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 transition-all"
                  />
                </div>

                <div className="rounded-xl bg-slate-100 p-3 text-[11px] text-slate-600 leading-relaxed">
                  ⚠️ <strong>Immediate Effect:</strong> This tenant will be logged out and their phone number will no longer be permitted to log in. Their bed will be marked free.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVacatingTenant(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingVacate}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    {submittingVacate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    <span>Confirm Vacate & Revoke Login</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default function TenantsManagerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <TenantsManagerContent />
    </Suspense>
  );
}
