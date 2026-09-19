import { NextRequest, NextResponse } from "next/server";
import { authenticateUnifiedPhone } from "@/lib/store";
import { adminAuth, createTenantCustomToken } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otp, idToken } = await req.json();

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
        console.error("Firebase Admin ID token verification error:", tokenErr);
        return NextResponse.json(
          { success: false, error: "Firebase Phone verification token is invalid or expired." },
          { status: 401 }
        );
      }
    } else if (!otp || otp.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 6-digit OTP code." },
        { status: 400 }
      );
    }

    const authResult = await authenticateUnifiedPhone(cleanPhone, otp || "verified");

    // Issue custom Firebase auth token if needed
    const customToken = await createTenantCustomToken(
      authResult.role === "tenant" ? (authResult.user as any).id : `${authResult.role}-${authResult.user.phone}`,
      { role: authResult.role }
    );

    return NextResponse.json({
      success: true,
      role: authResult.role,
      user: authResult.user,
      redirect: authResult.redirect,
      token: customToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Authentication failed" },
      { status: 401 }
    );
  }
}
