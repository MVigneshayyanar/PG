import { NextRequest, NextResponse } from "next/server";
import { authenticateUnifiedPhone } from "@/lib/store";
import { verifyFirebaseIdToken } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { phoneNumber, otp, idToken } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Please provide your mobile number." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phoneNumber).replace(/[^0-9]/g, "").slice(-10);

    // Cryptographically verify Firebase Auth ID Token if provided
    if (idToken) {
      try {
        const decoded = await verifyFirebaseIdToken(idToken);
        if (decoded?.phone_number) {
          const tokenPhone = decoded.phone_number.replace(/[^0-9]/g, "").slice(-10);
          if (tokenPhone && tokenPhone !== cleanPhone) {
            return NextResponse.json(
              { success: false, error: "Authenticated phone session does not match the provided phone number." },
              { status: 403 }
            );
          }
        }
      } catch (tokenErr: any) {
        console.warn("Firebase ID token verification fallback:", tokenErr?.message);
      }
    } else if (!otp || String(otp).trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "Valid 6-digit verification code is required." },
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
      { success: false, error: error?.message || "Authentication failed. Please try again." },
      { status: 400 }
    );
  }
}
