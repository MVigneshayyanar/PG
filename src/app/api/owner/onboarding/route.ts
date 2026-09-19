import { NextRequest, NextResponse } from "next/server";
import { updatePG, getPG } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;
    const pg = await getPG(pgId);

    // Omit keySecret in client-facing response
    const sanitizedPG = {
      ...pg,
      razorpay: {
        keyId: pg.razorpay?.keyId || "",
        // keySecret is never returned to client
        hasSecretConfigured: Boolean(pg.razorpay?.keySecret),
      },
    };

    return NextResponse.json({ success: true, pg: sanitizedPG });
  } catch (error) {
    console.error("Error in GET /api/owner/onboarding:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch PG profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pgName, location, gstin, ebRatePerUnit, razorpayKeyId, razorpayKeySecret } = body;

    if (!pgName || !location?.address || !location?.city || !location?.pincode) {
      return NextResponse.json(
        { success: false, error: "PG Name and full location details are required." },
        { status: 400 }
      );
    }

    const currentPG = await getPG();

    const updated = await updatePG({
      pgName: pgName.trim(),
      location: {
        address: location.address.trim(),
        city: location.city.trim(),
        pincode: location.pincode.trim(),
      },
      gstin: gstin ? gstin.trim() : undefined,
      ebRatePerUnit: ebRatePerUnit !== undefined ? Number(ebRatePerUnit) : currentPG.ebRatePerUnit,
      razorpay: {
        keyId: razorpayKeyId?.trim() || currentPG.razorpay?.keyId || "",
        keySecret: razorpayKeySecret?.trim() || currentPG.razorpay?.keySecret || "",
      },
    });

    const sanitizedPG = {
      ...updated,
      razorpay: {
        keyId: updated.razorpay?.keyId || "",
        hasSecretConfigured: Boolean(updated.razorpay?.keySecret),
      },
    };

    return NextResponse.json({
      success: true,
      message: "PG profile updated successfully",
      pg: sanitizedPG,
    });
  } catch (error) {
    console.error("Error in POST /api/owner/onboarding:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update PG profile" },
      { status: 500 }
    );
  }
}
