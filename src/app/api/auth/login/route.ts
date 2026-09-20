import { NextRequest, NextResponse } from "next/server";
import { authenticateUnifiedPhone } from "@/lib/store";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber, otp, idToken } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Please provide your mobile number." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);

    // Cryptographically verify Firebase Auth ID Token when provided or when Firebase Admin is configured
    if (idToken && isFirebaseAdminConfigured && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const tokenPhone = (decoded.phone_number || "").replace(/[^0-9]/g, "").slice(-10);
        if (tokenPhone && tokenPhone !== cleanPhone) {
          return NextResponse.json(
            { success: false, error: "Authenticated phone session does not match the provided phone number." },
            { status: 403 }
          );
        }
      } catch (tokenErr: any) {
        console.error("Firebase Admin ID token verification error:", tokenErr);
        return NextResponse.json(
          { success: false, error: "Session verification failed or token expired. Please request a new OTP." },
          { status: 401 }
        );
      }
    } else if (!otp || otp.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Valid 6-digit verification code or active phone session is required." },
        { status: 400 }
      );
    }

    const authResult = await authenticateUnifiedPhone(cleanPhone, otp || "verified_token");

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
