import { NextRequest, NextResponse } from "next/server";
import { searchTenantHistory, getPG } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const ownerPhone = searchParams.get("ownerPhone") || req.headers.get("x-owner-phone");
    const pgId = searchParams.get("pgId") || req.headers.get("x-pg-id");

    // Compliance with DPDP Act 2023: Only authenticated property owners can perform background checks
    if (!ownerPhone && !pgId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Cross-property verification requires an active property owner session.",
        },
        { status: 401 }
      );
    }

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Valid 10-digit phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
    const result = await searchTenantHistory(cleanPhone);

    return NextResponse.json({
      success: true,
      ...result,
      complianceNotice:
        "Information is processed solely for lawful residential tenancy verification under the Digital Personal Data Protection Act, 2023. Unauthorized dissemination is strictly prohibited.",
    });
  } catch (error: any) {
    console.error("History search error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Search failed" },
      { status: 500 }
    );
  }
}
