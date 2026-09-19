import { NextRequest, NextResponse } from "next/server";
import { registerPG } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pgName,
      ownerName,
      ownerPhone,
      address,
      city,
      pincode,
      contactPhone,
      gstin,
      ebRatePerUnit,
      razorpayKeyId,
      razorpayKeySecret,
    } = body;

    if (!pgName || !ownerName || !ownerPhone || !address || !city || !pincode) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required property and owner contact details." },
        { status: 400 }
      );
    }

    const pg = await registerPG({
      pgName,
      ownerName,
      ownerPhone,
      location: { address, city, pincode },
      contactPhone,
      gstin,
      ebRatePerUnit: ebRatePerUnit ? Number(ebRatePerUnit) : 15,
      razorpayKeyId,
      razorpayKeySecret,
    });

    return NextResponse.json({
      success: true,
      message: "PG application submitted successfully! Admin will verify and approve your property.",
      pg,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Registration failed" },
      { status: 400 }
    );
  }
}
