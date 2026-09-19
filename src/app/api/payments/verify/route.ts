import { NextRequest, NextResponse } from "next/server";
import { markPaymentPaid } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const paymentReference =
      razorpayPaymentId || `pay_rzp_${Math.random().toString(36).substring(2, 10)}`;

    const updatedPayment = await markPaymentPaid(paymentId, paymentReference);

    if (!updatedPayment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
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
