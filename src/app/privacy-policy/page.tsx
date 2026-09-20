import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | PG Management Platform",
  description: "Digital Personal Data Protection Act (DPDP 2023) and IT Act 2000 compliant privacy policy.",
};

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-3.5 h-3.5" />
              DPDP Act 2023 & IT Act 2000 Compliant
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last updated: September 20, 2026 | Effective immediately
            </p>
          </div>

          <section className="space-y-4 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              1. Commitment to User Privacy
            </h2>
            <p>
              We respect your privacy and are committed to protecting personally identifiable information (PII)
              under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the{" "}
              <strong>Information Technology Act, 2000</strong> (including the Information Technology Reasonable
              Security Practices and Procedures and Sensitive Personal Data or Information Rules, 2011).
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Residents/Tenants:</strong> Full name, verified mobile phone number, room assignment, monthly
                rent and electricity (EB) dues, and payment transaction reference IDs.
              </li>
              <li>
                <strong>Property Owners:</strong> Full name, contact phone number, accommodation name, address, GSTIN
                (where provided), electricity billing tariff, and payment gateway configuration (e.g. Razorpay Key ID).
              </li>
              <li>
                <strong>Technical Information:</strong> IP address, browser type, device identifiers, and session
                metadata collected strictly for authentication and fraud prevention.
              </li>
            </ul>
          </section>

          <section className="space-y-4 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">3. Purpose and Legal Grounds of Processing</h2>
            <p>Your data is processed strictly for legitimate tenancy administration purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Facilitating rent collection and electricity bill calculation</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Logging maintenance tickets and property communications</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Authentication via secure SMS OTP verification</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Enforcing terms, preventing fraud, and resolving billing disputes</span>
              </div>
            </div>
          </section>

          <section className="space-y-4 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">4. Payment Processing and Financial Credentials</h2>
            <p>
              All online digital payments are processed through RBI-authorized payment aggregators (including
              Razorpay). We do <strong>not</strong> store debit/credit card numbers, CVVs, or NetBanking net banking
              passwords on our servers. All sensitive merchant API secrets are stored in secure environment keys and are
              never transmitted to frontend user browsers.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">5. Tenant Rights under DPDP Act 2023</h2>
            <p>
              In accordance with Section 11, 12, and 13 of the Digital Personal Data Protection Act, 2023, you have the
              right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access a summary of your personal data held by the platform.</li>
              <li>Request correction, completion, or updating of inaccurate personal data.</li>
              <li>Request erasure of personal data once tenancy has concluded and legal retention requirements are satisfied.</li>
              <li>Seek grievance redressal through our designated Grievance Officer.</li>
            </ul>
          </section>

          <section className="space-y-4 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">6. Grievance Officer & Contact</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data rights,
              please reach out to our Grievance Redressal Officer:
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
              <p className="font-semibold text-emerald-950">Grievance Redressal Officer</p>
              <p className="text-slate-600">PG Management Compliance Cell</p>
              <p className="text-slate-600">Email: support@pgmanager.local | Phone: +91 9626855406</p>
              <p className="text-slate-600">Response turnaround: Within 48 hours</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
