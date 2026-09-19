import { NextRequest, NextResponse } from "next/server";
import { recordRoomEBReading, getRoomEBReadings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;
    const month = searchParams.get("month") || undefined;

    const readings = await getRoomEBReadings(pgId, month);
    return NextResponse.json({ success: true, ebReadings: readings });
  } catch (error: any) {
    console.error("GET /api/rooms/eb-reading error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch EB readings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, units, rate, month, pgId } = body;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Please select a room to record the EB reading." },
        { status: 400 }
      );
    }

    if (units === undefined || units === null || isNaN(Number(units)) || Number(units) < 0) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid meter reading (units consumed)." },
        { status: 400 }
      );
    }

    const result = await recordRoomEBReading({
      roomId,
      units: Number(units),
      rate: rate !== undefined && rate !== "" ? Number(rate) : undefined,
      month,
      pgId,
    });

    return NextResponse.json({
      success: true,
      message: `EB reading of ${result.units} units recorded for Room ${result.roomNumber}. Total ₹${result.totalRoomEB.toLocaleString("en-IN")} split among ${result.activeTenantsCount} resident(s) (₹${result.perTenantEB.toLocaleString("en-IN")} each added to monthly rent).`,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/rooms/eb-reading error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record EB reading" },
      { status: 400 }
    );
  }
}
