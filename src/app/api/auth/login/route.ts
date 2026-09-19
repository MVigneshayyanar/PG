import { NextRequest, NextResponse } from "next/server";
import { authenticateUnifiedPhone } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber, otp } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Please provide your mobile number." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

    const authResult = await authenticateUnifiedPhone(cleanPhone, otp || "verified");

    return NextResponse.json({
      success: true,
      role: authResult.role,
      user: authResult.user,
      redirect: authResult.redirect,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Authentication failed" },
      { status: 400 }
    );
  }
}
