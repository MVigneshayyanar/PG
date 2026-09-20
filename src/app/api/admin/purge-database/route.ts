import { NextRequest, NextResponse } from "next/server";
import { getAdminInstances, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

// All Firestore collections used by the app
const COLLECTIONS = [
  "pgs",
  "rooms",
  "tenants",
  "tenant_history",
  "payments",
  "tickets",
  "eb_readings",
];

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();

    // Secure guard: must be configured via environment variable
    const configuredSecret = process.env.ADMIN_PURGE_SECRET;
    if (!configuredSecret || secret !== configuredSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid purge secret or purge feature disabled." },
        { status: 403 }
      );
    }

    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DANGEROUS_PURGE !== "true") {
      return NextResponse.json(
        { success: false, error: "Database purge is disabled in production." },
        { status: 403 }
      );
    }

    const { adminDb } = await getAdminInstances();

    if (!isFirebaseAdminConfigured || !adminDb) {
      return NextResponse.json({
        success: true,
        message: "Firebase Admin not configured — in-memory store will reset on next server restart.",
        deleted: 0,
      });
    }

    let totalDeleted = 0;
    const summary: Record<string, number> = {};

    for (const col of COLLECTIONS) {
      const snap = await adminDb.collection(col).get();
      const batch = adminDb.batch();
      snap.docs.forEach((d: any) => batch.delete(d.ref));
      if (snap.size > 0) await batch.commit();
      summary[col] = snap.size;
      totalDeleted += snap.size;
    }

    console.log("[ADMIN PURGE] Deleted all documents from Firestore via Admin SDK:", summary);

    return NextResponse.json({
      success: true,
      message: "All Firestore data has been purged successfully.",
      totalDeleted,
      summary,
    });
  } catch (error: any) {
    console.error("Error in /api/admin/purge-database:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to purge database" },
      { status: 500 }
    );
  }
}
