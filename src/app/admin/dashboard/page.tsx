"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  CreditCard,
  User,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  PhoneCall,
  BedDouble,
  FileText,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PGApplication } from "@/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [applications, setApplications] = useState<PGApplication[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
        setCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
      showToast("error", "Failed to fetch applications. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user session has admin role or redirect
    const rawSession = localStorage.getItem("pgm_session");
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session.role !== "admin" && session.phone !== "9626855406" && session.phone !== "9626855406" && session.phone !== "9626855406") {
          // If not admin, still allow viewing if they want or notify
        }
      } catch (e) {
        console.warn("Session check error:", e);
      }
    }
    fetchApplications();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUpdateStatus = async (pgId: string, status: "approved" | "rejected", reason?: string) => {
    try {
      setActionLoadingId(pgId);
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pgId, status, rejectionReason: reason }),
      });
      const data = await res.json();

      if (data.success) {
        showToast("success", `Application for "${data.pg.pgName}" marked as ${status.toUpperCase()}!`);
        await fetchApplications();
      } else {
        showToast("error", data.error || "Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      showToast("error", "Network error updating status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    // Tab filter
    if (filterTab !== "all" && app.status !== filterTab) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.pgName.toLowerCase().includes(q);
      const matchOwner = app.ownerName.toLowerCase().includes(q);
      const matchPhone = app.ownerPhone.includes(q);
      const matchCity = app.location.city.toLowerCase().includes(q);
      const matchAddress = app.location.address.toLowerCase().includes(q);
      if (!matchName && !matchOwner && !matchPhone && !matchCity && !matchAddress) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f7f2] text-[#072e18]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#d8ebd9] rounded-3xl p-6 shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bce6c5] bg-[#dcf2e1] px-3 py-1 text-xs font-bold text-[#07361b]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#ff6b00]" />
              Super Admin Control Center
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">
              PG Property Applications & Verifications
            </h1>
            <p className="text-xs text-[#33613b]">
              Review newly registered PG properties. Approving an application activates their listing and grants owner dashboard login.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchApplications}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-[#c8e4ce] bg-[#f8fbf8] hover:bg-[#dcf2e1] px-4 py-2 text-xs font-bold text-[#07361b] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#ff6b00]" : "text-[#1e7c3b]"}`} />
              <span>Refresh</span>
            </button>
            <a
              href="tel:9626855406"
              className="inline-flex items-center gap-2 rounded-full bg-[#07361b] hover:bg-[#052814] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all"
            >
              <PhoneCall className="h-3.5 w-3.5 text-[#ff6b00]" />
              <span>Admin Hotline: 9626855406</span>
            </a>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div
            className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${toastMessage.type === "success"
              ? "bg-[#dcf2e1] border border-[#bce6c5] text-[#07361b]"
              : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-[#1e7c3b] shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-[#d8ebd9] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#51a162] uppercase tracking-wider">Pending Review</p>
              <p className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">{counts.pending}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#d8ebd9] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#dcf2e1] text-[#07361b] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-[#1e7c3b]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#51a162] uppercase tracking-wider">Approved PGs</p>
              <p className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">{counts.approved}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#d8ebd9] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <XCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#51a162] uppercase tracking-wider">Rejected</p>
              <p className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">{counts.rejected}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#d8ebd9] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf4ec] text-[#07361b] flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-[#07361b]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#51a162] uppercase tracking-wider">Total Enrolled</p>
              <p className="font-display text-2xl sm:text-3xl font-black text-[#07361b]">{counts.total}</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl border border-[#d8ebd9] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterTab("pending")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filterTab === "pending"
                ? "bg-[#ff6b00] text-white shadow-xs"
                : "bg-[#f8fbf8] text-[#33613b] hover:bg-[#dcf2e1]"
                }`}
            >
              <span>Pending Review</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterTab === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"
                }`}>
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setFilterTab("approved")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filterTab === "approved"
                ? "bg-[#07361b] text-white shadow-xs"
                : "bg-[#f8fbf8] text-[#33613b] hover:bg-[#dcf2e1]"
                }`}
            >
              <span>Approved PGs</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterTab === "approved" ? "bg-white/20 text-white" : "bg-[#dcf2e1] text-[#07361b]"
                }`}>
                {counts.approved}
              </span>
            </button>

            <button
              onClick={() => setFilterTab("rejected")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${filterTab === "rejected"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-[#f8fbf8] text-[#33613b] hover:bg-[#dcf2e1]"
                }`}
            >
              <span>Rejected</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterTab === "rejected" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-900"
                }`}>
                {counts.rejected}
              </span>
            </button>

            <button
              onClick={() => setFilterTab("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterTab === "all"
                ? "bg-[#07361b] text-white shadow-xs"
                : "bg-[#f8fbf8] text-[#33613b] hover:bg-[#dcf2e1]"
                }`}
            >
              All Applications ({counts.total})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#51a162]" />
            <input
              type="text"
              placeholder="Search PG, owner, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#c8e4ce] bg-[#f8fbf8] pl-10 pr-4 py-2 text-xs text-[#07361b] focus:bg-white focus:border-[#07361b] focus:outline-none focus:ring-2 focus:ring-[#07361b]/10 transition-all"
            />
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-[#d8ebd9] p-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff6b00] mx-auto" />
            <p className="text-xs font-bold text-[#07361b]">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#d8ebd9] p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#dcf2e1] text-[#07361b] flex items-center justify-center mx-auto">
              <Building2 className="h-7 w-7 text-[#1e7c3b]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#07361b]">No Applications Found</h3>
            <p className="text-xs text-[#33613b] max-w-sm mx-auto">
              {filterTab === "pending"
                ? "No pending applications at the moment! All registered PGs have been reviewed."
                : "No applications match your selected filter or search keyword."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const isActioning = actionLoadingId === app.id;
              const isPending = app.status === "pending";
              const isApproved = app.status === "approved";
              const isRejected = app.status === "rejected";

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl border border-[#d8ebd9] p-6 shadow-xs hover:shadow-md hover:border-[#bce6c5] transition-all space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eef5ef] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-lg sm:text-xl font-black text-[#07361b]">
                          {app.pgName}
                        </h2>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="h-3 w-3 text-amber-600" />
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#dcf2e1] text-[#07361b] border border-[#bce6c5]">
                            <CheckCircle2 className="h-3 w-3 text-[#1e7c3b]" />
                            Approved & Active
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            <XCircle className="h-3 w-3 text-rose-600" />
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#51a162] flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#1e7c3b] shrink-0" />
                        <span>
                          {app.location.address}, {app.location.city} - {app.location.pincode}
                        </span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(app.id, "approved")}
                            disabled={isActioning}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#1e7c3b] hover:bg-[#165e2c] text-white px-4 py-2 text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                          >
                            {isActioning ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span>Approve PG</span>
                          </button>

                          <button
                            onClick={() => {
                              const reason = prompt("Enter reason for rejection (optional):", "Incomplete address or document verification pending");
                              if (reason !== null) {
                                handleUpdateStatus(app.id, "rejected", reason);
                              }
                            }}
                            disabled={isActioning}
                            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => {
                            if (confirm(`Revoke approval for "${app.pgName}"? Owner will lose dashboard access.`)) {
                              handleUpdateStatus(app.id, "rejected", "Approval revoked by Admin");
                            }
                          }}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 px-3 py-1.5 text-xs font-medium transition-all"
                        >
                          Revoke Approval
                        </button>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, "approved")}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1e7c3b] hover:bg-[#165e2c] text-white px-4 py-2 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Re-Approve</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Owner Details */}
                    <div className="bg-[#f8fbf8] border border-[#e2efe4] rounded-2xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[#51a162] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <User className="h-3 w-3 text-[#1e7c3b]" />
                        Owner Contact
                      </span>
                      <p className="font-bold text-[#07361b] text-sm">{app.ownerName}</p>
                      <a
                        href={`tel:${app.ownerPhone}`}
                        className="inline-flex items-center gap-1 font-mono font-bold text-[#ff6b00] hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        <span>+91 {app.ownerPhone}</span>
                      </a>
                    </div>

                    {/* Razorpay Online Payments */}
                    <div className="bg-[#f8fbf8] border border-[#e2efe4] rounded-2xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[#51a162] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-[#1e7c3b]" />
                        Razorpay Payment Gateway
                      </span>
                      {app.razorpay?.keyId ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#07361b] bg-[#dcf2e1] px-2 py-0.5 rounded-full border border-[#bce6c5]">
                            <Check className="h-3 w-3 text-[#1e7c3b]" />
                            Key Configured
                          </span>
                          <p className="font-mono text-[11px] text-[#33613b] truncate">
                            {app.razorpay.keyId}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#6b9474]">
                          Not connected (Optional)
                        </p>
                      )}
                    </div>

                    {/* Electricity Rate & GSTIN */}
                    <div className="bg-[#f8fbf8] border border-[#e2efe4] rounded-2xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[#51a162] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Zap className="h-3 w-3 text-[#ff6b00]" />
                        EB Rate & Tax
                      </span>
                      <p className="font-bold text-[#07361b]">
                        ₹{app.ebRatePerUnit || 15} / Unit
                      </p>
                      <p className="text-[11px] text-[#33613b]">
                        GSTIN: {app.gstin ? <span className="font-mono">{app.gstin}</span> : "Not provided"}
                      </p>
                    </div>

                    {/* Initial Capacity / Date */}
                    <div className="bg-[#f8fbf8] border border-[#e2efe4] rounded-2xl p-3.5 space-y-1.5">
                      <span className="font-bold text-[#51a162] uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <BedDouble className="h-3 w-3 text-[#1e7c3b]" />
                        Rooms & Capacity
                      </span>
                      <p className="font-bold text-[#07361b]">
                        {app.roomCount || 2} Rooms ({app.totalCapacity || 3} Beds)
                      </p>
                      <p className="text-[11px] text-[#6b9474]">
                        Submitted: {new Date(app.submittedAt || app.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Rejection Note if rejected */}
                  {isRejected && app.rejectionReason && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Rejection Note: </span>
                        <span>{app.rejectionReason}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
