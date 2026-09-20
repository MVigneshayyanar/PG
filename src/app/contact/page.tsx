import React from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Clock, ShieldCheck, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact Us & Support | PG Management Platform",
  description: "Contact details, customer support hotline, and Grievance Officer information.",
};

export default function ContactPage() {
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
              <Phone className="w-3.5 h-3.5" />
              Help & Support
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Contact Us
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Have questions or need assistance? Our support and administrative team are here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-2">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Phone Hotline</h3>
              <p className="text-xs text-slate-500">Available Monday through Saturday, 9 AM – 8 PM</p>
              <a
                href="tel:9626855406"
                className="inline-block font-semibold text-emerald-700 hover:text-emerald-800 text-sm pt-1"
              >
                +91 9626855406
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-2">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Email Support</h3>
              <p className="text-xs text-slate-500">For general queries, billing disputes & assistance</p>
              <a
                href="mailto:support@pgmanager.local"
                className="inline-block font-semibold text-emerald-700 hover:text-emerald-800 text-sm pt-1"
              >
                support@pgmanager.local
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Registered Office</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PG Management Platform Operations,
                <br />
                Tamil Nadu, India
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Grievance Officer</h3>
              <p className="text-xs text-slate-500">Designated officer under IT Act & DPDP Act 2023</p>
              <p className="text-xs text-slate-700 font-medium pt-1">
                Email: grievance@pgmanager.local
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
            <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Are you an active tenant?</span> You can directly log
              service complaints and track resolutions 24/7 through your{" "}
              <Link href="/tenant/dashboard" className="text-emerald-700 font-semibold underline">
                Tenant Portal Helpdesk
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
