import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

    return NextResponse.json({
      success: true,
      message: `Please complete verification to receive your SMS OTP at +91 ${cleanPhone}.`,
      phoneNumber: cleanPhone,
    });
  } catch (error) {
    console.error("Error in /api/otp/send:", error);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch OTP" },
      { status: 500 }
    );
  }
}
