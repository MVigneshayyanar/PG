import { NextRequest, NextResponse } from "next/server";
import { getPreviousTenantsHistory } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;

    const previousTenants = await getPreviousTenantsHistory(pgId);
    return NextResponse.json({ success: true, previousTenants });
  } catch (error: any) {
    console.error("Previous tenants error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load history" },
      { status: 500 }
    );
  }
}
