import { NextRequest, NextResponse } from "next/server";
import { markPaymentPaid, getPaymentById, getPG } from "@/lib/store";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      );
    }

    const pg = await getPG(payment.pgId);
    const keySecret = pg?.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET;
    const isLiveRazorpay =
      keySecret &&
      !keySecret.includes("mock") &&
      !keySecret.includes("demosecret") &&
      keySecret.length > 10;

    // Cryptographic signature check when live Razorpay credentials are in place
    if (isLiveRazorpay) {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed: Razorpay order, payment ID, and signature are required.",
          },
          { status: 400 }
        );
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json(
          { success: false, error: "Cryptographic signature mismatch. Payment authenticity could not be verified." },
          { status: 400 }
        );
      }
    }

    if (!razorpayPaymentId) {
      return NextResponse.json(
        { success: false, error: "Payment reference identifier is required." },
        { status: 400 }
      );
    }

    const updatedPayment = await markPaymentPaid(paymentId, razorpayPaymentId);

    if (!updatedPayment) {
      return NextResponse.json(
        { success: false, error: "Failed to mark payment as paid." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and status updated to paid",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error in /api/payments/verify:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
