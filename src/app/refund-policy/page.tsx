import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Clock, CheckCircle, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Cancellation & Refund Policy | PG Management Platform",
  description: "Official cancellation, refund, and security deposit return policy.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f9f4] via-white to-slate-50 text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:text-emerald-950 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 p-8 sm:p-12 space-y-8">
          <div className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3">
              <RefreshCw className="w-3.5 h-3.5" />
              Razorpay & RBI Payment Compliance
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Cancellation & Refund Policy
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last updated: September 20, 2026 | Covers Rent, Security Deposits & Service Fees
            </p>
          </div>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">1. Monthly Rent Payments</h2>
            <p>
              Monthly rent payments and electricity charges (EB readings) paid through the online portal are generally{" "}
              <strong>non-refundable</strong> once credited towards a resident&apos;s active month of stay. If an incorrect
              amount was charged or an adjustment was approved by the PG owner (such as an unapplied discount), the
              property owner can adjust the subsequent month&apos;s invoice or initiate a direct adjustment.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">2. Security Deposit Refund & Vacating Notice</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Notice Period:</strong> Residents are required to furnish a standard 30-day notice period (or as
                specified in their tenancy agreement) prior to vacating.
              </li>
              <li>
                <strong>Deposit Settlement:</strong> Upon vacating and successful room inspection, security deposits are
                refunded by the PG owner after deducting any outstanding electricity units, pending rent dues, or room
                damage costs.
              </li>
              <li>
                <strong>Refund Mode:</strong> Security deposit refunds are issued directly to the resident&apos;s original bank
                account or UPI ID within 5 to 7 business days following the formal checkout.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              3. Duplicate or Erroneous Transactions
            </h2>
            <p>
              If your bank account was debited more than once due to a payment gateway latency or network interruption:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>The duplicate transaction will automatically be reconciled by Razorpay/Banking channels within 24 to 48 hours.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Refunded amounts are credited back to the source payment method (card, net banking, or UPI) within 5 to 7 banking days.</span>
              </div>
            </div>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              4. Dispute Resolution & Contact
            </h2>
            <p>
              For any billing discrepancies, failed payments, or refund escalations, please contact the property manager
              or our billing helpdesk:
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
              <p className="font-semibold text-emerald-950">Billing & Refunds Desk</p>
              <p className="text-slate-600">Email: refunds@pgmanager.local | Phone: +91 9626855406</p>
              <p className="text-slate-600">Please quote your Payment ID and Registered Phone Number.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
