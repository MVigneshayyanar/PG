import { NextRequest, NextResponse } from "next/server";
import { getTenantByPhone } from "@/lib/store";
import { createTenantCustomToken } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otp } = await req.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

    // In production, verify OTP against your OTP provider (e.g. MSG91, Twilio, Firebase Auth).
    // Replace the length check below with a real token validation call.
    if (!otp || otp.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP. Please enter the 6-digit verification code." },
        { status: 401 }
      );
    }

    // Lookup tenant — only pre-registered tenants (added by owner) can log in
    const tenant = await getTenantByPhone(cleanPhone);

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This number is not registered as a tenant. Please ask your PG owner to add your number first.",
        },
        { status: 404 }
      );
    }

    if (tenant.active === false) {
      return NextResponse.json(
        {
          success: false,
          error: "Your tenancy has been vacated/deactivated by the property owner.",
        },
        { status: 403 }
      );
    }

    // Generate custom Firebase Auth token using Admin SDK (or fallback mock JWT)
    const customToken = await createTenantCustomToken(tenant.id, {
      phoneNumber: tenant.phoneNumber,
      pgId: tenant.pgId,
      roomId: tenant.roomId,
    });

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      token: customToken,
      tenant,
    });
  } catch (error) {
    console.error("Error in /api/otp/verify:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
