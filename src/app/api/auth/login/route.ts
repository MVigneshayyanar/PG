import { NextRequest, NextResponse } from "next/server";
import { authenticateUnifiedPhone } from "@/lib/store";
import { createTenantCustomToken } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otp } = await req.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, error: "Please provide both mobile number and OTP." },
        { status: 400 }
      );
    }

    const authResult = await authenticateUnifiedPhone(phoneNumber, otp);

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
