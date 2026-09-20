import React from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck, Shield, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | PG Management Platform",
  description: "Terms and Conditions governing the use of PG Management Platform.",
};

export default function TermsPage() {
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
              <FileCheck className="w-3.5 h-3.5" />
              Platform Agreement
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last updated: September 20, 2026 | Applies to all Owners, Residents, and Visitors
            </p>
          </div>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, registering on, or using this PG Management Platform, you acknowledge that you
              have read, understood, and agree to be bound by these Terms and Conditions along with our Privacy Policy
              and Refund Policy.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">2. Platform Role & Limitations</h2>
            <p>
              This platform provides automated property management, billing computation, rent invoicing, and ticketing
              services connecting Paying Guest (PG) accommodation owners with prospective and active residents. The
              platform itself is not a real estate broker or landlord and does not directly lease premises. Tenancy
              agreements remain directly between the property owner and the resident.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">3. Resident Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Residents must provide valid, accurate, and active 10-digit mobile numbers for verification.</li>
              <li>Monthly rent and electricity dues must be cleared on or before the due date specified by the property owner.</li>
              <li>Residents agree to abide by property conduct, safety, and hygiene rules established by the respective accommodation.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900">4. Owner Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Owners must accurately state room amenities, sharing capacities, and meter tariff rates.</li>
              <li>Owners shall not post defamatory, unverified, or unlawful remarks regarding residents.</li>
              <li>Owners must comply with all local municipal, fire safety, and GST regulations applicable to hostel operations.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              5. Payment Processing & Fees
            </h2>
            <p>
              All online rent and bill settlements are routed directly to the designated property owner&apos;s Razorpay
              or authorized merchant payment gateway account. Transaction processing charges (if applicable) are
              disclosed prior to final authorization.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-600">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              6. Limitation of Liability
            </h2>
            <p>
              In no event shall the platform owners, developers, or affiliates be liable for any indirect, incidental,
              consequential, or punitive damages arising from tenancy disputes, property damage, power interruptions, or
              unauthorized access outside our reasonable control.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
