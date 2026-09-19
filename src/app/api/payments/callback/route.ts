import { NextRequest, NextResponse } from "next/server";
import { markPaymentPaid, getPaymentById } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const razorpayPaymentId =
      searchParams.get("razorpay_payment_id") ||
      searchParams.get("razorpay_payment_link_id") ||
      `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const phone = searchParams.get("phone") || "";

    if (paymentId) {
      await markPaymentPaid(paymentId, razorpayPaymentId);
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUrl = new URL(`${protocol}://${host}/tenant/dashboard`);

    if (phone) redirectUrl.searchParams.set("phone", phone);
    redirectUrl.searchParams.set("payment_success", "true");
    redirectUrl.searchParams.set("ref", razorpayPaymentId);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Error in /api/payments/callback:", error);
    return NextResponse.redirect(new URL("/tenant/dashboard?error=payment_failed", req.url));
  }
}
