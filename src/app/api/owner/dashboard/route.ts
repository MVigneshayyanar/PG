import { NextRequest, NextResponse } from "next/server";
import { getOwnerDashboardData } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;
    const month = searchParams.get("month") || undefined;

    const dashboard = await getOwnerDashboardData(pgId, month);
    return NextResponse.json({ success: true, ...dashboard });
  } catch (error) {
    console.error("Error in /api/owner/dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
