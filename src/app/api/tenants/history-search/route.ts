import { NextRequest, NextResponse } from "next/server";
import { searchTenantHistory } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Valid 10-digit phone number is required." },
        { status: 400 }
      );
    }

    const result = await searchTenantHistory(phone);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("History search error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Search failed" },
      { status: 500 }
    );
  }
}
