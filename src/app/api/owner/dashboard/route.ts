import { NextRequest, NextResponse } from "next/server";
import { getOwnerDashboardData } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;
    const phone = searchParams.get("phone") || undefined;
    const month = searchParams.get("month") || undefined;

    const dashboard = await getOwnerDashboardData(pgId, month, phone);
    return NextResponse.json({ success: true, ...dashboard });
  } catch (error: any) {
    console.error("Error in /api/owner/dashboard:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
