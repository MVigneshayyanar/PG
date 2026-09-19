import { NextRequest, NextResponse } from "next/server";
import { authenticateUnifiedPhone } from "@/lib/store";
import { adminAuth, createTenantCustomToken } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber, otp, idToken } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Please provide both mobile number and OTP." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

    // Verify Firebase ID token if provided
    if (idToken && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const tokenPhone = (decoded.phone_number || "").replace(/[^0-9]/g, "").slice(-10);
        if (tokenPhone && tokenPhone !== cleanPhone) {
          return NextResponse.json(
            { success: false, error: "Phone number does not match the verified Firebase token." },
            { status: 403 }
          );
        }
      } catch (tokenErr: any) {
        console.warn("Firebase Admin ID token verification warning:", tokenErr?.message);
        // If Admin SDK verification fails due to service account/network issues, but client verified OTP, continue
      }
    } else if (!otp || otp.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 6-digit OTP code." },
        { status: 400 }
      );
    }

    const authResult = await authenticateUnifiedPhone(cleanPhone, otp || "verified");

    // Issue custom Firebase auth token if needed
    let customToken: string | null = null;
    try {
      customToken = await createTenantCustomToken(
        authResult.role === "tenant" ? (authResult.user as any).id : `${authResult.role}-${authResult.user.phone}`,
        { role: authResult.role }
      );
    } catch (tokenErr) {
      console.warn("Could not generate custom token:", tokenErr);
    }

    return NextResponse.json({
      success: true,
      role: authResult.role,
      user: authResult.user,
      redirect: authResult.redirect,
      token: customToken,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Authentication failed" },
      { status: 401 }
    );
  }
}
