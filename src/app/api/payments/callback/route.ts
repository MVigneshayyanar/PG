import { NextRequest, NextResponse } from "next/server";
import { markPaymentPaid, getPaymentById } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const razorpayPaymentId = searchParams.get("razorpay_payment_id");
    const razorpayPaymentLinkId = searchParams.get("razorpay_payment_link_id");
    const paymentLinkStatus = searchParams.get("razorpay_payment_link_status");
    const phone = searchParams.get("phone") || "";

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUrl = new URL(`${protocol}://${host}/tenant/dashboard`);
    if (phone) redirectUrl.searchParams.set("phone", phone);

    // Only mark paid if a genuine payment identifier or successful payment link status is present
    const isConfirmedPaid =
      Boolean(razorpayPaymentId) ||
      paymentLinkStatus === "paid" ||
      searchParams.get("status") === "paid";

    if (paymentId && isConfirmedPaid) {
      const verifiedRef =
        razorpayPaymentId || razorpayPaymentLinkId || "razorpay_verified_link";
      await markPaymentPaid(paymentId, verifiedRef);
      redirectUrl.searchParams.set("payment_success", "true");
      redirectUrl.searchParams.set("ref", verifiedRef);
    } else {
      redirectUrl.searchParams.set("payment_status", "pending_verification");
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Error in /api/payments/callback:", error);
    return NextResponse.redirect(new URL("/tenant/dashboard?error=payment_failed", req.url));
  }
}
