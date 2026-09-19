import { NextRequest, NextResponse } from "next/server";

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

    // In production, integrate a real OTP provider here (e.g. MSG91, Twilio, Firebase Auth).
    console.log(`[OTP SERVICE] Dispatching OTP to +91 ${cleanPhone}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}. Please check your messages.`,
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
