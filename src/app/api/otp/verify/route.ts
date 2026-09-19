import { NextRequest, NextResponse } from "next/server";
import { getTenantByPhone } from "@/lib/store";
import { adminAuth, createTenantCustomToken } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otp, idToken } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

    // Cryptographically verify the Firebase Auth ID Token if provided
    if (idToken && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const tokenPhone = (decoded.phone_number || "").replace(/[^0-9]/g, "").slice(-10);
        if (tokenPhone && tokenPhone !== cleanPhone) {
          return NextResponse.json(
            { success: false, error: "Phone number does not match the verified session token." },
            { status: 403 }
          );
        }
      } catch (err: any) {
        console.error("Firebase Admin ID token verification error:", err);
        return NextResponse.json(
          { success: false, error: "Phone verification token is invalid or expired." },
          { status: 401 }
        );
      }
    } else if (!otp || otp.trim().length < 6) {
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
            "You are not part of any PG in this platform. Please contact your PG owner to add your number.",
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

    // Generate custom Firebase Auth token using Admin SDK
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
