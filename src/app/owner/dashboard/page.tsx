"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Copy,
  Check,
  Plus,
  Settings,
  Loader2,
  ArrowUpRight,
  Star,
  ShieldAlert,
  ShieldCheck,
  History,
  Phone,
  Zap,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pencil,
  IndianRupee,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Payment, Room, Ticket, OwnerDashboardStats, PGProfile, TenantHistory, RoomEBReading, Tenant } from "@/types";

export default function OwnerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [data, setData] = useState<{
    pg: PGProfile;
    stats: OwnerDashboardStats;
    selectedMonth?: string;
    paidList: Payment[];
    unpaidList: Payment[];
    vacantRooms: (Room & { availableSlots: number })[];
    tickets: Ticket[];
    previousTenants?: TenantHistory[];
    rooms?: Room[];
    tenants?: Tenant[];
    ebReadings?: RoomEBReading[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"all" | "paid" | "unpaid" | "vacant" | "tickets" | "history" | "eb">("all");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "resolved">("open");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);

  // EB Reading Modal State
  const [showEBModal, setShowEBModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [ebUnits, setEbUnits] = useState("");
  const [ebRate, setEbRate] = useState("15");
  const [ebMonth, setEbMonth] = useState("2026-09");
  const [recordingEB, setRecordingEB] = useState(false);
  const [ebError, setEbError] = useState<string | null>(null);
  const [ebSuccess, setEbSuccess] = useState<string | null>(null);

  // Edit Bill Modal State
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editBaseRent, setEditBaseRent] = useState("");
  const [editEbAmount, setEditEbAmount] = useState("");
  const [editAdditional, setEditAdditional] = useState("");
  const [editAdditionalNote, setEditAdditionalNote] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editDiscountNote, setEditDiscountNote] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState<"paid" | "unpaid">("unpaid");
  const [savingBill, setSavingBill] = useState(false);
  const [editBillError, setEditBillError] = useState<string | null>(null);

  const MONTH_OPTIONS = [
    { value: "2026-09", label: "September 2026 (Current Month)" },
    { value: "2026-08", label: "August 2026" },
    { value: "2026-07", label: "July 2026" },
    { value: "2026-06", label: "June 2026" },
    { value: "2026-05", label: "May 2026" },
    { value: "2026-04", label: "April 2026" },
    { value: "2026-03", label: "March 2026" },
    { value: "2026-02", label: "February 2026" },
    { value: "2026-01", label: "January 2026" },
  ];

  const formatMonthLabel = (m: string) => {
    const found = MONTH_OPTIONS.find((opt) => opt.value === m);
    if (found) return found.label.replace(" (Current Month)", "");
    const parts = m.split("-");
    if (parts.length !== 2) return m;
    const year = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const fetchDashboard = async (targetMonth = selectedMonth) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/owner/dashboard?month=${targetMonth}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.pg?.ebRatePerUnit) {
          setEbRate(String(json.pg.ebRatePerUnit));
        }
        if (json.rooms && json.rooms.length > 0) {
          setSelectedRoomId((prev) => (prev ? prev : json.rooms[0].id));
        }
        // Sync owner name to localStorage so Navbar displays real owner name immediately!
        if (typeof window !== "undefined" && json.pg?.ownerName) {
          try {
            const existing = localStorage.getItem("pgm_session");
            let parsed = existing ? JSON.parse(existing) : {};
            parsed.role = "owner";
            parsed.name = json.pg.ownerName;
            parsed.user = {
              ...(parsed.user || {}),
              name: json.pg.ownerName,
              phone: json.pg.ownerPhone,
              pgName: json.pg.pgName,
              pgId: json.pg.id,
            };
            localStorage.setItem("pgm_session", JSON.stringify(parsed));
            window.dispatchEvent(new Event("storage"));
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedMonth);
  }, [selectedMonth]);

  // Lock body scroll when any modal is active
  useEffect(() => {
    if (showEBModal || showEditBillModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showEBModal, showEditBillModal]);

  const handleOpenEditBill = (p: Payment) => {
    setEditingPayment(p);
    setEditBaseRent(String(p.baseRent ?? p.amount));
    setEditEbAmount(String(p.ebAmount ?? 0));
    setEditAdditional(String((p as any).additionalCharges ?? 0));
    setEditAdditionalNote((p as any).additionalChargesNote ?? "");
    setEditDiscount(String((p as any).discount ?? 0));
    setEditDiscountNote((p as any).discountNote ?? "");
    setEditNote((p as any).note ?? "");
    setEditStatus(p.status);
    setEditBillError(null);
    setShowEditBillModal(true);
  };

  const handleSaveEditBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setEditBillError(null);
    try {
      setSavingBill(true);
      const res = await fetch(`/api/payments/${editingPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseRent: Number(editBaseRent) || 0,
          ebAmount: Number(editEbAmount) || 0,
          additionalCharges: Number(editAdditional) || 0,
          additionalChargesNote: editAdditionalNote,
          discount: Number(editDiscount) || 0,
          discountNote: editDiscountNote,
          note: editNote,
          status: editStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEditBillModal(false);
        await fetchDashboard(selectedMonth);
      } else {
        setEditBillError(json.error || "Failed to update bill");
      }
    } catch (err: any) {
      setEditBillError("Network error. Please try again.");
    } finally {
      setSavingBill(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      setResolvingTicketId(ticketId);
      const res = await fetch(`/api/tickets/${ticketId}`, { method: "PATCH" });
      if (res.ok) {
        await fetchDashboard(selectedMonth);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingTicketId(null);
    }
  };

  const handleCopyReminder = (tenantName: string, phone: string, amount: number, room: string) => {
    const text = `Hi ${tenantName}, this is a gentle reminder regarding your PG rent of ₹${amount.toLocaleString(
      "en-IN"
    )} for Room ${room}. Please log in to PGM to clear your dues. Thank you!`;
    navigator.clipboard.writeText(text);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  const handleOpenEBModal = (preselectedRoomId?: string) => {
    setEbError(null);
    setEbSuccess(null);
    setEbMonth(selectedMonth);

    const targetId = preselectedRoomId || selectedRoomId || data?.rooms?.[0]?.id || "";
    setSelectedRoomId(targetId);

    // Auto-populate if an EB reading already exists for this room in this month
    const existing = data?.ebReadings?.find(
      (r) => r.roomId === targetId && r.month === selectedMonth
    );

    if (existing) {
      setEbUnits(String(existing.units));
      setEbRate(String(existing.rate));
    } else {
      setEbUnits("");
      if (data?.pg?.ebRatePerUnit) {
        setEbRate(String(data.pg.ebRatePerUnit));
      } else {
        setEbRate("15");
      }
    }
    setShowEBModal(true);
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const existing = data?.ebReadings?.find(
      (r) => r.roomId === roomId && r.month === ebMonth
    );
    if (existing) {
      setEbUnits(String(existing.units));
      setEbRate(String(existing.rate));
    } else {
      setEbUnits("");
      if (data?.pg?.ebRatePerUnit) {
        setEbRate(String(data.pg.ebRatePerUnit));
      } else {
        setEbRate("15");
      }
    }
  };

  const handleRecordEB = async (e: React.FormEvent) => {
    e.preventDefault();
    setEbError(null);
    setEbSuccess(null);

    if (!selectedRoomId) {
      setEbError("Please select a room.");
      return;
    }

    const unitsNum = Number(ebUnits);
    if (isNaN(unitsNum) || unitsNum < 0) {
      setEbError("Please enter valid electricity units consumed.");
      return;
    }

    try {
      setRecordingEB(true);
      const res = await fetch("/api/rooms/eb-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          units: unitsNum,
          rate: Number(ebRate) || 15,
          month: ebMonth,
          pgId: data?.pg?.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEbSuccess(json.message);
        await fetchDashboard();
        setTimeout(() => {
          setShowEBModal(false);
          setEbSuccess(null);
        }, 1800);
      } else {
        setEbError(json.error || "Failed to record EB reading");
      }
    } catch (err: any) {
      console.error(err);
      setEbError("Network error recording EB reading");
    } finally {
      setRecordingEB(false);
    }
  };

  const filteredTickets =
    data?.tickets.filter((t) => {
      if (ticketFilter === "all") return true;
      return t.status === ticketFilter;
    }) || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with PG Info, Month Selector & Actions */}
        <div className="bg-white p-6 rounded-3xl border border-[#d8ebd9] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">
                  {data?.pg?.pgName || "My PG Accommodation"}
                </h1>
              </div>
              <p className="text-xs text-[#33613b] mt-1 flex items-center gap-1.5 font-medium">
                <span>{data?.pg?.location?.address}, {data?.pg?.location?.city}</span>
                {data?.pg?.ownerPhone && <span>• Phone: +91 {data.pg.ownerPhone}</span>}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleOpenEBModal()}
                className="flex items-center gap-1.5 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all active:scale-98"
              >
                <Zap className="h-4 w-4 fill-white" />
                <span>Record Room EB</span>
              </button>

              <Link
                href="/owner/rooms"
                className="flex items-center gap-1.5 rounded-full bg-[#07361b] hover:bg-[#0e4d29] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
              >
                <Plus className="h-4 w-4" />
                Manage Rooms
              </Link>

              <Link
                href="/owner/tenants"
                className="flex items-center gap-1.5 rounded-full bg-[#186030] hover:bg-[#124d26] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
              >
                <Plus className="h-4 w-4" />
                Manage Tenants
              </Link>

              <Link
                href="/owner/onboarding"
                className="flex items-center gap-1.5 rounded-full border border-[#d6e8da] bg-[#f4f9f5] hover:bg-[#eaf4ec] px-3.5 py-2 text-xs font-bold text-[#07361b] transition-all"
                title="Edit Profile"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          {/* Month Selector Bar */}
          <div className="pt-3 border-t border-[#edf5ee] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-[#edf6ee] px-4 py-1.5 rounded-full border border-[#bce6c5]">
                <Calendar className="h-4 w-4 text-[#1e7c3b] shrink-0" />
                <span className="text-xs font-bold text-[#07361b]">Billing Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white rounded-full border border-[#bce6c5] px-3 py-1 text-xs font-black text-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/15 cursor-pointer shadow-xs"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Prev / Next Month Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Previous Month"
                  onClick={() => {
                    const idx = MONTH_OPTIONS.findIndex((o) => o.value === selectedMonth);
                    if (idx < MONTH_OPTIONS.length - 1) {
                      setSelectedMonth(MONTH_OPTIONS[idx + 1].value);
                    }
                  }}
                  disabled={selectedMonth === MONTH_OPTIONS[MONTH_OPTIONS.length - 1].value}
                  className="p-1.5 rounded-full border border-[#d6e8da] bg-[#f4f9f5] hover:bg-[#eaf4ec] text-[#07361b] disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Next Month"
                  onClick={() => {
                    const idx = MONTH_OPTIONS.findIndex((o) => o.value === selectedMonth);
                    if (idx > 0) {
                      setSelectedMonth(MONTH_OPTIONS[idx - 1].value);
                    }
                  }}
                  disabled={selectedMonth === MONTH_OPTIONS[0].value}
                  className="p-1.5 rounded-full border border-[#d6e8da] bg-[#f4f9f5] hover:bg-[#eaf4ec] text-[#07361b] disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {selectedMonth !== "2026-09" ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#c2410c] font-bold flex items-center gap-1.5 bg-[#fff4eb] px-3 py-1 rounded-full border border-[#ffd4b2]">
                  <Clock className="h-3.5 w-3.5 text-[#ff6b00]" />
                  Historical Data for {formatMonthLabel(selectedMonth)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMonth("2026-09")}
                  className="px-3 py-1 rounded-full bg-[#07361b] text-white text-[11px] font-bold hover:bg-[#0e4d29] transition-all shadow-xs"
                >
                  Jump to Current (Sep 2026)
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-[#33613b] font-medium hidden sm:inline">
                Displaying real-time rent collections and outstanding dues for current cycle
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#07361b] animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading property data...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Rent Collected */}
              <div className="bg-[#dcf2e1] p-5 rounded-3xl border border-[#bce6c5] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#07361b]">
                    Collected Rent ({formatMonthLabel(selectedMonth)})
                  </span>
                  <div className="h-7 w-7 rounded-full bg-[#c7e3cc] text-[#07361b] flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-[#1e7c3b]" />
                  </div>
                </div>
                <div className="font-display text-2xl font-black text-[#07361b]">
                  ₹{data?.stats?.totalCollected?.toLocaleString("en-IN") || 0}
                </div>
                <p className="text-[11px] text-[#1e7c3b] font-bold">
                  {data?.paidList?.length || 0} tenants cleared
                </p>
              </div>

              {/* Pending Dues */}
              <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Pending Dues ({formatMonthLabel(selectedMonth)})
                  </span>
                  <div className="h-7 w-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="font-display text-2xl font-black text-rose-600">
                  ₹{data?.stats?.totalPending?.toLocaleString("en-IN") || 0}
                </div>
                <p className="text-[11px] text-rose-500 font-semibold">
                  {data?.unpaidList?.length || 0} tenants pending
                </p>
              </div>

              {/* Occupancy Rate */}
              <div className="bg-[#07361b] p-5 rounded-3xl text-white shadow-lg shadow-[#07361b]/15 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#a3d3ad]">Occupancy</span>
                  <div className="h-7 w-7 rounded-full bg-[#124d26] text-white flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="font-display text-2xl font-black text-white">
                  {data?.stats?.occupancyRate || 0}%
                </div>
                <p className="text-[11px] text-[#a3d3ad] font-bold">
                  {data?.stats?.totalOccupied || 0}/{data?.stats?.totalCapacity || 0} beds filled
                </p>
              </div>

              {/* Tenant History */}
              <div className="bg-[#fff4eb] p-5 rounded-3xl border border-[#ffd4b2] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7c2d12]">Tenant Records</span>
                  <div className="h-7 w-7 rounded-full bg-[#ffedd5] text-[#ff6b00] flex items-center justify-center">
                    <Star className="h-4 w-4 fill-[#ff6b00]" />
                  </div>
                </div>
                <div className="font-display text-2xl font-black text-[#ff6b00]">
                  {data?.previousTenants?.length || 0}
                </div>
                <p className="text-[11px] text-[#c2410c] font-bold">
                  Vacated & rated records
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-[#edf6ee] p-1.5 rounded-full border border-[#d6e8da]">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-[#07361b] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                Overview (All Lists)
              </button>

              <button
                onClick={() => setActiveTab("paid")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "paid"
                    ? "bg-[#07361b] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1e7c3b]" />
                Paid List ({data?.paidList?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab("unpaid")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "unpaid"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "text-rose-700 hover:bg-rose-50"
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Unpaid List ({data?.unpaidList?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab("vacant")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "vacant"
                    ? "bg-[#07361b] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <DoorOpen className="h-3.5 w-3.5" />
                Vacant Rooms ({data?.vacantRooms?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab("tickets")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "tickets"
                    ? "bg-[#ff6b00] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                Tickets ({data?.stats?.openTicketsCount || 0})
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "history"
                    ? "bg-[#07361b] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Previous Tenant History ({data?.previousTenants?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab("eb")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "eb"
                    ? "bg-[#ff6b00] text-white shadow-xs"
                    : "text-[#24452c] hover:text-[#07361b]"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Room EB Readings ({data?.ebReadings?.length || 0})
              </button>
            </div>

            {/* 1. PAID LIST */}
            {(activeTab === "all" || activeTab === "paid") && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                      Paid Tenants ({formatMonthLabel(selectedMonth)})
                    </h2>
                    <p className="text-xs text-slate-500">Rent paid & recorded with gateway confirmation</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Total: ₹{data?.stats?.totalCollected?.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Tenant Name</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Mobile Phone</th>
                        <th className="px-4 py-3">Amount Paid</th>
                        <th className="px-4 py-3">Payment ID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.paidList && data.paidList.length > 0 ? (
                        data.paidList.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">{p.tenantName}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-[#edf6ee] font-mono font-bold text-[#07361b] text-[11px] border border-[#bce6c5]">
                                Room {p.roomNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono">+91 {p.phoneNumber}</td>
                            <td className="px-4 py-3">
                              <div className="font-extrabold text-emerald-700">
                                ₹{p.amount.toLocaleString("en-IN")}
                              </div>
                              {p.ebAmount ? (
                                <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                                  <Zap className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                  <span>Rent ₹{(p.baseRent || p.amount - p.ebAmount).toLocaleString("en-IN")} + EB ₹{p.ebAmount.toLocaleString("en-IN")}</span>
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                              {p.razorpayPaymentId || "pay_verified"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                PAID
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleOpenEditBill(p)}
                                title="Edit Bill"
                                className="inline-flex items-center gap-1 rounded-lg border border-[#d8ebd9] bg-[#f4f9f5] hover:bg-[#dcf2e1] px-2.5 py-1 text-[11px] font-semibold text-[#07361b] transition-all"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No paid transactions for this month yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 2. UNPAID LIST */}
            {(activeTab === "all" || activeTab === "unpaid") && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                      Unpaid Tenants ({formatMonthLabel(selectedMonth)})
                    </h2>
                    <p className="text-xs text-slate-500">Tenants with outstanding payments for {formatMonthLabel(selectedMonth)}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Pending: ₹{data?.stats?.totalPending?.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Tenant Name</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Mobile Phone</th>
                        <th className="px-4 py-3">Amount Due (Rent + EB)</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.unpaidList && data.unpaidList.length > 0 ? (
                        data.unpaidList.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">{p.tenantName}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-[#edf6ee] font-mono font-bold text-[#07361b] text-[11px] border border-[#bce6c5]">
                                Room {p.roomNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono">+91 {p.phoneNumber}</td>
                            <td className="px-4 py-3">
                              <div className="font-extrabold text-rose-600">
                                ₹{p.amount.toLocaleString("en-IN")}
                              </div>
                              {p.ebAmount ? (
                                <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                                  <Zap className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                  <span>Rent ₹{(p.baseRent || p.amount - p.ebAmount).toLocaleString("en-IN")} + EB ₹{p.ebAmount.toLocaleString("en-IN")}</span>
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                <AlertCircle className="h-3 w-3" />
                                OVERDUE
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    handleCopyReminder(
                                      p.tenantName || "Tenant",
                                      p.phoneNumber || "",
                                      p.amount,
                                      p.roomNumber || ""
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-all"
                                >
                                  {copiedPhone === p.phoneNumber ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600" />
                                      <span className="text-emerald-700">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Remind</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleOpenEditBill(p)}
                                  title="Edit Bill"
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#d8ebd9] bg-[#f4f9f5] hover:bg-[#dcf2e1] px-2.5 py-1 text-[11px] font-semibold text-[#07361b] transition-all"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-emerald-700 font-semibold">
                            All tenant dues cleared for this month!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 3. VACANT ROOMS LIST */}
            {(activeTab === "all" || activeTab === "vacant") && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-[#07361b] flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#1e7c3b] inline-block" />
                      Vacant Rooms & Slots
                    </h2>
                    <p className="text-xs text-[#33613b]">Rooms with available beds ready for new tenants</p>
                  </div>
                  <Link
                    href="/owner/rooms"
                    className="text-xs font-bold text-[#ff6b00] hover:underline flex items-center gap-1"
                  >
                    View All Rooms <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data?.vacantRooms && data.vacantRooms.length > 0 ? (
                    data.vacantRooms.map((r) => (
                      <div key={r.id} className="p-4 rounded-2xl border border-[#d8ebd9] bg-[#f8fbf8] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-[#07361b] text-base">
                            Room {r.roomNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5]">
                            {r.availableSlots} bed{r.availableSlots > 1 ? "s" : ""} free
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Category: {r.category}-Sharing</span>
                            <span className="font-bold text-slate-900">₹{r.rentAmount.toLocaleString("en-IN")}/mo</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Occupied: {r.currentTenantsCount || 0}/{r.capacity}</span>
                            <span>{Math.round(((r.currentTenantsCount || 0) / r.capacity) * 100)}% full</span>
                          </div>
                        </div>

                        <Link
                          href={`/owner/tenants?roomId=${r.id}`}
                          className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-[#07361b] hover:bg-[#0f4523] text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Assign Resident</span>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-6 text-center text-slate-400 text-xs">
                      All rooms are currently 100% occupied.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 4. PREVIOUS TENANTS HISTORY TAB */}
            {(activeTab === "all" || activeTab === "history") && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <History className="h-4 w-4 text-[#1e7c3b]" />
                      Previous Tenants Rental History & Ratings
                    </h2>
                    <p className="text-xs text-slate-500">
                      Past residents who have vacated this PG, including your exit star ratings, feedback, and blackmark records
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {data?.previousTenants?.length || 0} Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Tenant Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Stay Period</th>
                        <th className="px-4 py-3">Owner Rating</th>
                        <th className="px-4 py-3">Record Status</th>
                        <th className="px-4 py-3">Owner Feedback / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.previousTenants && data.previousTenants.length > 0 ? (
                        data.previousTenants.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">{h.name}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">+91 {h.phoneNumber}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700">Room {h.roomNumber}</td>
                            <td className="px-4 py-3 text-slate-500 text-[11px]">
                              {h.joinedAt} ➔ {h.vacatedAt}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${
                                      i < h.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-slate-700 font-bold text-xs">{h.rating}/5</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {h.blackmark ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                                  <ShieldAlert className="h-3 w-3" />
                                  BLACKMARKED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                  <ShieldCheck className="h-3 w-3" />
                                  CLEAN RECORD
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                              "{h.comment}"
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No previous tenants vacated yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 5. TICKETS PANEL */}
            {(activeTab === "all" || activeTab === "tickets") && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-amber-600" />
                      Maintenance Complaints & Requests
                    </h2>
                    <p className="text-xs text-slate-500">Live issues submitted by resident tenants</p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
                    <button
                      onClick={() => setTicketFilter("open")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ticketFilter === "open"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Open Issues
                    </button>
                    <button
                      onClick={() => setTicketFilter("resolved")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ticketFilter === "resolved"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() => setTicketFilter("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ticketFilter === "all"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                t.status === "open"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {t.status.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {t.category}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Room {t.roomNumber} • By {t.tenantName}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                          <p className="text-xs text-slate-600">{t.description}</p>
                        </div>

                        {t.status === "open" && (
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            disabled={resolvingTicketId === t.id}
                            className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                          >
                            {resolvingTicketId === t.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            <span>Mark Resolved</span>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No complaints matching the selected filter.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 6. ROOM ELECTRICITY (EB) READINGS LIST */}
            {(activeTab === "all" || activeTab === "eb") && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500 fill-amber-400" />
                      Room Electricity (EB) Readings ({formatMonthLabel(selectedMonth)})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Meter units multiplied by rate per unit (₹{data?.pg?.ebRatePerUnit || 15}/unit) and divided strictly among active staying tenants in each room
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenEBModal()}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Record New Reading</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Billing Month</th>
                        <th className="px-4 py-3">Meter Units</th>
                        <th className="px-4 py-3">Rate/Unit</th>
                        <th className="px-4 py-3">Total Room EB</th>
                        <th className="px-4 py-3">Active Residents</th>
                        <th className="px-4 py-3">Per Resident Share</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.ebReadings && data.ebReadings.length > 0 ? (
                        data.ebReadings.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-lg bg-[#edf6ee] font-mono font-black text-[#07361b] text-xs border border-[#bce6c5]">
                                Room {r.roomNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">{r.month}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">
                              {r.units} units
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600">
                              ₹{r.rate}/unit
                            </td>
                            <td className="px-4 py-3 font-black text-slate-900">
                              ₹{r.totalRoomEB.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                <Users className="h-3 w-3" />
                                {r.activeTenantsCount} Staying
                              </span>
                              {r.vacantSlotsCount > 0 && (
                                <span className="ml-1.5 text-[10px] text-slate-400">
                                  ({r.vacantSlotsCount} vacant excluded)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-extrabold text-amber-700">
                              +₹{r.perTenantEB.toLocaleString("en-IN")} / tenant
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleOpenEBModal(r.roomId)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-all"
                              >
                                Edit Reading
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                            No electricity meter readings recorded yet for {formatMonthLabel(selectedMonth)}. Click &ldquo;Record Room EB&rdquo; to enter meter units.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* RECORD ROOM EB READING MODAL (rendered at root with z-[9999] to completely blur entire window including Navbar) */}
      {showEBModal && (
        <div className="fixed inset-0 !m-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Zap className="h-5 w-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {data?.ebReadings?.some(
                      (r) =>
                        r.roomId === (selectedRoomId || (data?.rooms?.[0]?.id ?? "")) &&
                        r.month === ebMonth
                    )
                      ? `Edit Room EB Reading`
                      : "Record Room EB Reading"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    One entry per room per month • Auto-computes bill & splits equally among currently staying residents
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowEBModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const targetId = selectedRoomId || (data?.rooms?.[0]?.id ?? "");
              const existing = data?.ebReadings?.find(
                (r) => r.roomId === targetId && r.month === ebMonth
              );
              if (existing) {
                return (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Zap className="h-4 w-4 text-amber-600" />
                      Editing Recorded Reading ({existing.units} units @ ₹{existing.rate}/unit)
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold border border-amber-200 text-amber-700">
                      Month: {ebMonth}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {ebError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{ebError}</span>
              </div>
            )}

            {ebSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{ebSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordEB} className="space-y-4 text-xs">
              {/* Room Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select Room *
                </label>
                <select
                  value={selectedRoomId || (data?.rooms?.[0]?.id ?? "")}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                >
                  {!selectedRoomId && <option value="">-- Choose Room --</option>}
                  {data?.rooms?.map((r) => {
                    const occupants =
                      data?.tenants?.filter((t) => t.roomId === r.id && t.active !== false) || [];
                    const vacant = Math.max(0, r.capacity - occupants.length);
                    return (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.category}-Sharing) — {occupants.length} Staying Resident{occupants.length !== 1 ? "s" : ""}{vacant > 0 ? `, ${vacant} Vacant` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Meter Reading Units and Rate Per Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Meter Reading (Units) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 400"
                    value={ebUnits}
                    onChange={(e) => setEbUnits(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Rate per Unit (₹ / Unit) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      required
                      placeholder="15"
                      value={ebRate}
                      onChange={(e) => setEbRate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Month */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Billing Month
                </label>
                <input
                  type="month"
                  value={ebMonth || "2026-09"}
                  onChange={(e) => setEbMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
                />
              </div>

              {/* Dynamic Live Calculation Card */}
              {(() => {
                const effectiveRoomId = selectedRoomId || (data?.rooms?.[0]?.id ?? "");
                const modalRoom = data?.rooms?.find((r) => r.id === effectiveRoomId);
                const roomOccupants =
                  data?.tenants?.filter(
                    (t) => t.roomId === effectiveRoomId && t.active !== false
                  ) || [];
                const activeCount = roomOccupants.length;
                const roomCapacity = modalRoom?.capacity || 1;
                const vacantCount = Math.max(0, roomCapacity - activeCount);
                const calcUnits = Number(ebUnits) || 0;
                const calcRate = Number(ebRate) || (data?.pg?.ebRatePerUnit || 15);
                const calcTotal = Math.round(calcUnits * calcRate);
                const calcPerResident = activeCount > 0 ? Math.round(calcTotal / activeCount) : 0;

                return (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200/60 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                        Live EB Bill Breakdown
                      </span>
                      <span className="font-mono">
                        {calcUnits} units × ₹{calcRate} = ₹{calcTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                        <span className="text-slate-500 block">Active Staying Residents:</span>
                        <span className="font-black text-slate-900 text-sm">
                          {activeCount} Resident{activeCount !== 1 ? "s" : ""}
                        </span>
                        {vacantCount > 0 && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ({vacantCount} vacant bed excluded)
                          </span>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                        <span className="text-slate-500 block">Split Per Resident:</span>
                        <span className="font-black text-amber-700 text-sm">
                          ₹{calcPerResident.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Added to monthly rent
                        </span>
                      </div>
                    </div>

                    {activeCount === 0 ? (
                      <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                        ⚠️ Cannot split EB: Room {modalRoom?.roomNumber || ""} has 0 active residents. Please assign a resident to this room first.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-100">
                        ℹ️ <span className="font-semibold text-slate-800">Automatic Billing Impact:</span> Each of the {activeCount} resident(s) will have <span className="font-bold text-amber-700">₹{calcPerResident.toLocaleString("en-IN")}</span> added to their monthly bill (Base Rent + EB = Total Payable).
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEBModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    recordingEB ||
                    !ebUnits ||
                    Number(ebUnits) <= 0 ||
                    Boolean(
                      (() => {
                        const targetId = selectedRoomId || (data?.rooms?.[0]?.id ?? "");
                        return (
                          data?.rooms?.find((r) => r.id === targetId) &&
                          (data?.tenants?.filter(
                            (t) => t.roomId === targetId && t.active !== false
                          ).length || 0) === 0
                        );
                      })()
                    )
                  }
                  className="flex items-center gap-1.5 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all disabled:opacity-50 active:scale-98"
                >
                  {recordingEB ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving & Recalculating...</span>
                    </>
                  ) : Boolean(
                      data?.ebReadings?.some(
                        (r) =>
                          r.roomId === (selectedRoomId || (data?.rooms?.[0]?.id ?? "")) &&
                          r.month === ebMonth
                      )
                    ) ? (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      <span>Update Room EB & Adjust Rent</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      <span>Confirm & Apply to Rent</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT BILL MODAL ───────────────────────────────────────── */}
      {showEditBillModal && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#d8ebd9] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#edf5ee] bg-[#f8fbf8]">
              <div>
                <h2 className="font-display text-base font-black text-[#07361b] flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-[#ff6b00]" />
                  Edit Monthly Bill
                </h2>
                <p className="text-[11px] text-[#33613b] mt-0.5">
                  {editingPayment.tenantName} · Room {editingPayment.roomNumber} · {editingPayment.month}
                </p>
              </div>
              <button
                onClick={() => setShowEditBillModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#edf5ee] text-[#33613b] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBill} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {editBillError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                  {editBillError}
                </div>
              )}

              {/* Base Rent & EB */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">Base Rent (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#51a162]" />
                    <input
                      type="number"
                      min="0"
                      value={editBaseRent}
                      onChange={(e) => setEditBaseRent(e.target.value)}
                      className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-8 pr-3 py-2 text-sm font-mono text-[#07361b] focus:outline-none focus:border-[#07361b] focus:ring-2 focus:ring-[#07361b]/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#07361b] mb-1.5">EB Charges (₹)</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-2.5 h-3.5 w-3.5 text-amber-500" />
                    <input
                      type="number"
                      min="0"
                      value={editEbAmount}
                      onChange={(e) => setEditEbAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-8 pr-3 py-2 text-sm font-mono text-[#07361b] focus:outline-none focus:border-[#07361b] focus:ring-2 focus:ring-[#07361b]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#07361b]">Additional Charges (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#51a162]" />
                  <input
                    type="number"
                    min="0"
                    value={editAdditional}
                    onChange={(e) => setEditAdditional(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-8 pr-3 py-2 text-sm font-mono text-[#07361b] focus:outline-none focus:border-[#07361b] focus:ring-2 focus:ring-[#07361b]/10"
                  />
                </div>
                <input
                  type="text"
                  value={editAdditionalNote}
                  onChange={(e) => setEditAdditionalNote(e.target.value)}
                  placeholder="Reason (e.g. Laundry, Guest charge)"
                  className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:outline-none focus:border-[#07361b]"
                />
              </div>

              {/* Discount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#07361b]">Discount / Waiver (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-3.5 w-3.5 text-emerald-500" />
                  <input
                    type="number"
                    min="0"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] pl-8 pr-3 py-2 text-sm font-mono text-[#07361b] focus:outline-none focus:border-[#07361b] focus:ring-2 focus:ring-[#07361b]/10"
                  />
                </div>
                <input
                  type="text"
                  value={editDiscountNote}
                  onChange={(e) => setEditDiscountNote(e.target.value)}
                  placeholder="Reason (e.g. Advance paid, Loyalty discount)"
                  className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:outline-none focus:border-[#07361b]"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-[#07361b] mb-1.5">Internal Note (optional)</label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. Corrected after tenant dispute"
                  className="w-full rounded-xl border border-[#c8e4ce] bg-[#f8fbf8] px-3 py-2 text-xs text-[#07361b] focus:outline-none focus:border-[#07361b] resize-none"
                />
              </div>

              {/* Payment Status Toggle */}
              <div className="rounded-2xl border border-[#d8ebd9] bg-[#f4f9f5] p-3.5 space-y-2">
                <label className="block text-xs font-bold text-[#07361b]">Payment Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("unpaid")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      editStatus === "unpaid"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    Unpaid / Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("paid")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      editStatus === "paid"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    Mark as Paid
                  </button>
                </div>
              </div>

              {/* Live Total */}
              <div className="rounded-2xl bg-[#07361b] text-white px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[#a3d3ad]">New Bill Total</span>
                <span className="font-display text-xl font-black">
                  ₹{
                    (
                      (Number(editBaseRent) || 0) +
                      (Number(editEbAmount) || 0) +
                      (Number(editAdditional) || 0) -
                      (Number(editDiscount) || 0)
                    ).toLocaleString("en-IN")
                  }
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditBillModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBill}
                  className="flex items-center gap-1.5 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {savingBill ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Saving...</span></>
                  ) : (
                    <><Pencil className="h-3.5 w-3.5" /><span>Save Changes</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
