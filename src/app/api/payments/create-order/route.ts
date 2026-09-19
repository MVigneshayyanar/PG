import { NextRequest, NextResponse } from "next/server";
import { getPG } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, tenantId, amount, pgId } = await req.json();

    if (!paymentId || !amount) {
      return NextResponse.json(
        { success: false, error: "Payment ID and amount are required" },
        { status: 400 }
      );
    }

    const pg = await getPG(pgId);
    const keyId = pg.razorpay?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const keySecret = pg.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET;

    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // If real Razorpay keySecret is configured, execute Razorpay Orders API
    if (keySecret && keyId && keyId.startsWith("rzp_live")) {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // in paise
            currency: "INR",
            receipt: `rcpt_${paymentId}`,
            notes: { paymentId, tenantId, pgId: pg.id },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          return NextResponse.json({
            success: true,
            orderId: rzpData.id,
            amount: amount,
            currency: "INR",
            keyId: keyId,
            isLive: true,
          });
        }
      } catch (err) {
        console.warn("Razorpay API live call fallback to sandbox order:", err);
      }
    }

    // Default test / sandbox order response
    return NextResponse.json({
      success: true,
      orderId: simulatedOrderId,
      amount: amount,
      currency: "INR",
      keyId: keyId,
      isLive: false,
      pgName: pg.pgName,
    });
  } catch (error) {
    console.error("Error in /api/payments/create-order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate payment order" },
      { status: 500 }
    );
  }
}
