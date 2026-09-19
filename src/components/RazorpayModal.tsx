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
} from "lucide-react";
import { Payment } from "@/types";

interface RazorpayModalProps {
  payment: Payment;
  pgName: string;
  onSuccess: (updatedPayment: Payment) => void;
  onClose: () => void;
}

export function RazorpayModal({
  payment,
  pgName,
  onSuccess,
  onClose,
}: RazorpayModalProps) {
  const [method, setMethod] = useState<"quick" | "upi" | "card">("quick");
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [paymentResult, setPaymentResult] = useState<Payment | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handlePay = async () => {
    try {
      setProcessing(true);

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          tenantId: payment.tenantId,
          amount: payment.amount,
          pgId: payment.pgId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Order creation failed");
      }

      await new Promise((r) => setTimeout(r, 1000));
      const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          razorpayPaymentId: mockPaymentId,
          razorpayOrderId: orderData.orderId,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        setCompleted(true);
        setPaymentResult(verifyData.payment);

        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        setTimeout(() => {
          onSuccess(verifyData.payment);
        }, 1800);
      } else {
        alert(verifyData.error || "Payment verification failed");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      alert(err?.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 !m-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl">
        {/* Razorpay Pine Header */}
        <div className="bg-[#07361b] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-base leading-tight">Razorpay Checkout</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#ff6b00] text-white">
                  SECURE
                </span>
              </div>
              <p className="text-xs text-[#a3d3ad]">{pgName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="rounded-full p-1 text-white/80 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {completed ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">Payment Successful!</h4>
              <p className="text-xs text-slate-600 mt-1">
                ₹{payment.amount.toLocaleString("en-IN")} cleared for Month: <strong>{payment.month}</strong>
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment ID:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {paymentResult?.razorpayPaymentId || "pay_verified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resident:</span>
                <span className="font-bold text-slate-900">{payment.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Room:</span>
                <span className="font-bold text-slate-900">{payment.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-700 font-bold uppercase">PAID & VERIFIED</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">Updating resident dashboard...</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Amount Banner */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500">Monthly Dues ({payment.month})</span>
                  <p className="text-xs text-slate-700 font-semibold">Room {payment.roomNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{payment.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-bold">0% Transaction Fee</span>
                </div>
              </div>

              {payment.ebAmount ? (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Room Rent: <strong className="text-slate-800">₹{(payment.baseRent || payment.amount - payment.ebAmount).toLocaleString("en-IN")}</strong>
                  </span>
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    + EB: ₹{payment.ebAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Methods */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-2 block">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("quick")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    method === "quick"
                      ? "border-[#07361b] bg-[#dcf2e1] text-[#07361b] shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Sparkles className="h-5 w-5 mb-1 text-[#ff6b00]" />
                  Instant Pay
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("upi")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    method === "upi"
                      ? "border-[#07361b] bg-[#dcf2e1] text-[#07361b] shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="h-5 w-5 mb-1 text-[#1e7c3b]" />
                  UPI / QR
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    method === "card"
                      ? "border-[#07361b] bg-[#dcf2e1] text-[#07361b] shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-[#07361b]" />
                  Cards / NetBank
                </button>
              </div>
            </div>

            {method === "quick" && (
              <div className="rounded-xl bg-[#dcf2e1] border border-[#bce6c5] p-3 text-xs text-[#07361b] flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1e7c3b] shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Payment:</strong> Directly processes gateway order verification and issues receipt immediately.
                </span>
              </div>
            )}

            {method === "upi" && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1 text-slate-600">
                <p className="font-bold text-slate-800">Supported UPI Gateways:</p>
                <p className="text-[11px]">Google Pay • PhonePe • Paytm UPI • BHIM</p>
              </div>
            )}

            {method === "card" && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between font-mono">
                  <span>Card: 4111 •••• •••• 1111</span>
                  <span>12/28</span>
                </div>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#ff6b00] hover:bg-[#eb5e00] px-4 py-3.5 text-sm font-black text-white shadow-md shadow-[#ff6b00]/25 active:scale-98 transition-all disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Contacting Bank Gateway...</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{payment.amount.toLocaleString("en-IN")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Razorpay 256-bit Encrypted Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
