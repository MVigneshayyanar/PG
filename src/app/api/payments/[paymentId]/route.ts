import { NextRequest, NextResponse } from "next/server";
import { getPaymentById, updatePayment } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await req.json();

    const {
      baseRent,
      ebAmount,
      additionalCharges,
      additionalChargesNote,
      discount,
      discountNote,
      status,
      note,
    } = body;

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

    // Compute new total
    const newBaseRent =
      baseRent !== undefined ? Number(baseRent) : (payment.baseRent ?? payment.amount);
    const newEbAmount =
      ebAmount !== undefined ? Number(ebAmount) : (payment.ebAmount ?? 0);
    const newAdditional =
      additionalCharges !== undefined
        ? Number(additionalCharges)
        : ((payment as any).additionalCharges ?? 0);
    const newDiscount =
      discount !== undefined
        ? Number(discount)
        : ((payment as any).discount ?? 0);
    const newTotal = newBaseRent + newEbAmount + newAdditional - newDiscount;

    const updates: Record<string, any> = {
      baseRent: newBaseRent,
      ebAmount: newEbAmount,
      additionalCharges: newAdditional,
      additionalChargesNote:
        additionalChargesNote ?? (payment as any).additionalChargesNote ?? "",
      discount: newDiscount,
      discountNote: discountNote ?? (payment as any).discountNote ?? "",
      amount: newTotal,
      updatedAt: new Date().toISOString(),
    };

    if (note !== undefined) updates.note = note;

    // Manual paid toggle
    if (status === "paid" && payment.status !== "paid") {
      updates.status = "paid";
      updates.paidAt = new Date().toISOString();
      updates.razorpayPaymentId = "manual_by_owner";
    }
    // Reverse to unpaid
    if (status === "unpaid" && payment.status !== "unpaid") {
      updates.status = "unpaid";
      updates.paidAt = null;
      updates.razorpayPaymentId = null;
    }

    const updated = await updatePayment(paymentId, updates);

    return NextResponse.json({
      success: true,
      message: "Bill updated successfully",
      payment: updated,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/payments/[paymentId]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update payment" },
      { status: 500 }
    );
  }
}
