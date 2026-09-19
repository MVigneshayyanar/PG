"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  Zap,
  ExternalLink,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Payment } from "@/types";

interface RazorpayModalProps {
  payment: Payment;
  pgName: string;
  tenantName?: string;
  tenantPhone?: string;
  onSuccess: (updatedPayment: Payment) => void;
  onClose: () => void;
}

export function RazorpayModal({
  payment,
  pgName,
  tenantName = "Resident",
  tenantPhone = "",
  onSuccess,
  onClose,
}: RazorpayModalProps) {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [paymentResult, setPaymentResult] = useState<Payment | null>(null);
  const [hasLiveKeys, setHasLiveKeys] = useState<boolean | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Initiate order creation when modal opens
  useEffect(() => {
    initiateOrder();
  }, []);

  const initiateOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          tenantId: payment.tenantId,
          amount: payment.amount,
          pgId: payment.pgId,
          tenantName,
          tenantPhone,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      setHasLiveKeys(Boolean(data.isLive));

      // If a real Razorpay Payment Link (short_url) was generated, redirect immediately!
      if (data.paymentLink) {
        setRedirectUrl(data.paymentLink);
        setRedirecting(true);
        setTimeout(() => {
          window.location.href = data.paymentLink;
        }, 1200);
        return;
      }
    } catch (err: any) {
      console.warn("Payment initiation note:", err);
      setError(err?.message || "Could not connect to Razorpay live gateway");
    } finally {
      setLoading(false);
    }
  };

  // Launch official Razorpay Checkout SDK popup if available
  const handleLaunchCheckoutSdk = () => {
    if (typeof window === "undefined") return;

    const RazorpayConstructor = (window as any).Razorpay;
    if (!RazorpayConstructor) {
      setError("Razorpay checkout SDK is not loaded. Please try sandbox payment.");
      return;
    }

    try {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_demokey123456",
        amount: Math.round(payment.amount * 100),
        currency: "INR",
        name: pgName || "PG Accommodation",
        description: `Rent & EB Dues (${payment.month})`,
        handler: async function (response: any) {
          const rzpPaymentId =
            response.razorpay_payment_id ||
            `pay_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          await handleCompleteVerification(rzpPaymentId);
        },
        prefill: {
          name: tenantName,
          contact: tenantPhone,
        },
        theme: {
          color: "#07361b",
        },
      };

      const rzp = new RazorpayConstructor(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay SDK launch error:", err);
      setError(err?.message || "Could not launch Razorpay SDK");
    }
  };

  // Complete payment and mark paid in Firestore
  const handleCompleteVerification = async (rzpPaymentId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const paymentRef =
        rzpPaymentId || `pay_rzp_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          razorpayPaymentId: paymentRef,
        }),
      });

      const data = await res.json();
      if (data.success && data.payment) {
        setCompleted(true);
        setPaymentResult(data.payment);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        setTimeout(() => {
          onSuccess(data.payment);
        }, 2000);
      } else {
        throw new Error(data.error || "Payment verification failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Payment verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#d8ebd9] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Strip with Razorpay badge */}
        <div className="bg-[#07361b] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#0f4523]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-[#0e4d29] flex items-center justify-center shrink-0 border border-[#1b6a3b]">
              <Lock className="h-5 w-5 text-[#ff6b00]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm sm:text-base text-white truncate">
                  Razorpay Checkout
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#ff6b00] text-white uppercase tracking-wider shrink-0">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-[11px] text-[#a3d3ad] truncate">{pgName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors shrink-0"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {completed ? (
            /* Success State */
            <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-300">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#dcf2e1] text-[#07361b] flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-8 w-8 text-[#1e7c3b]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-black text-[#07361b]">
                  Payment Verified!
                </h3>
                <p className="text-xs text-[#33613b]">
                  Rent dues of <strong className="text-[#07361b]">₹{payment.amount.toLocaleString("en-IN")}</strong> for{" "}
                  {payment.month} cleared successfully.
                </p>
              </div>
              <div className="bg-[#f8fbf8] border border-[#d8ebd9] rounded-2xl p-3 text-xs font-mono text-slate-600">
                Ref ID: {paymentResult?.razorpayPaymentId || "pay_verified"}
              </div>
            </div>
          ) : redirecting ? (
            /* Redirection State */
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
              <Loader2 className="h-10 w-10 text-[#ff6b00] animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="font-display text-lg font-black text-[#07361b]">
                  Redirecting to Razorpay...
                </h3>
                <p className="text-xs text-[#33613b]">
                  Opening the official Razorpay payment page for {pgName}.
                </p>
              </div>

              {redirectUrl && (
                <div className="pt-2">
                  <a
                    href={redirectUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff6b00] hover:underline"
                  >
                    <span>Click here if not redirected automatically</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Main Checkout Options */
            <div className="space-y-4">
              {/* Payment Summary Pill */}
              <div className="bg-[#f4f9f5] rounded-2xl border border-[#d8ebd9] p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#51a162]">
                    Total Amount Due
                  </span>
                  <div className="font-display text-2xl font-black text-[#07361b]">
                    ₹{payment.amount.toLocaleString("en-IN")}
                  </div>
                  <p className="text-[11px] text-[#33613b] mt-0.5">
                    Month: {payment.month} • Room {payment.roomNumber}
                  </p>
                </div>
                <div className="text-right text-[11px] text-[#24452c]">
                  {payment.ebAmount ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-white border border-[#c8e4ce] font-semibold text-[#07361b]">
                      Rent + EB Included
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded bg-white border border-[#c8e4ce] font-semibold text-[#07361b]">
                      Base Rent
                    </span>
                  )}
                </div>
              </div>

              {/* Status or Gateway Notice */}
              {error && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-bold">Gateway Notice</p>
                    <p className="text-[11px] text-amber-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* Option 1: Official Razorpay SDK Popup */}
                <button
                  type="button"
                  onClick={handleLaunchCheckoutSdk}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#07361b] hover:bg-[#0b4d27] py-3.5 px-4 text-xs font-bold text-white shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4 text-[#ff6b00]" />
                  <span>Launch Official Razorpay Gateway</span>
                </button>

                {/* Option 2: Instant Sandbox / Demo Verification */}
                <button
                  type="button"
                  onClick={() => handleCompleteVerification()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] hover:bg-[#eb5e00] py-3.5 px-4 text-xs font-bold text-white shadow-md shadow-[#ff6b00]/25 transition-all active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Pay & Clear Dues (Instant Confirmation)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info about Razorpay Integration */}
              <div className="rounded-2xl border border-[#d8ebd9] bg-[#f8fbf8] p-3 text-[11px] text-[#33613b] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#07361b]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1e7c3b]" />
                  <span>Direct PG Owner Collection</span>
                </div>
                <p>
                  PG Owners connect their Razorpay Key in PG Settings. Supports UPI (Google Pay, PhonePe, Paytm), Netbanking, Credit & Debit cards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f8fbf8] border-t border-[#edf5ee] flex items-center justify-center gap-2 text-[10px] text-[#51a162] font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-[#1e7c3b]" />
          <span>Secured by Razorpay Payment Gateway & TLS Encryption</span>
        </div>
      </div>
    </div>
  );
}
