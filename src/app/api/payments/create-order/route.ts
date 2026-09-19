import { NextRequest, NextResponse } from "next/server";
import { getPG } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, tenantId, amount, pgId, origin: clientOrigin, tenantName, tenantPhone } =
      await req.json();

    if (!paymentId || !amount) {
      return NextResponse.json(
        { success: false, error: "Payment ID and amount are required" },
        { status: 400 }
      );
    }

    const pg = await getPG(pgId);
    const keyId =
      pg.razorpay?.keyId ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      "";
    const keySecret = pg.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET;

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appUrl = clientOrigin || `${protocol}://${host}`;

    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // If keySecret & keyId exist and look like active Razorpay keys
    if (
      keySecret &&
      keyId &&
      (keyId.startsWith("rzp_live_") || keyId.startsWith("rzp_test_")) &&
      !keyId.includes("demokey")
    ) {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

        // Attempt 1: Create a Razorpay Payment Link (which provides direct short_url redirection!)
        const plinkRes = await fetch("https://api.razorpay.com/v1/payment_links", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // in paise
            currency: "INR",
            accept_partial: false,
            description: `Rent payment for ${pg.pgName} (Ref: ${paymentId})`,
            customer: {
              name: tenantName || "Resident",
              contact: tenantPhone || "",
            },
            notify: {
              sms: false,
              email: false,
            },
            reminder_enable: false,
            notes: { paymentId, tenantId: tenantId || "", pgId: pg.id },
            callback_url: `${appUrl}/api/payments/callback?paymentId=${paymentId}&phone=${tenantPhone || ""}`,
            callback_method: "get",
          }),
        });

        if (plinkRes.ok) {
          const plinkData = await plinkRes.json();
          return NextResponse.json({
            success: true,
            paymentLink: plinkData.short_url,
            orderId: plinkData.id,
            amount: amount,
            currency: "INR",
            keyId: keyId,
            isLive: true,
            pgName: pg.pgName,
          });
        }

        // Attempt 2: Fallback to Orders API
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `rcpt_${paymentId.slice(-10)}`,
            notes: { paymentId, tenantId: tenantId || "", pgId: pg.id },
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
            pgName: pg.pgName,
          });
        }
      } catch (err) {
        console.warn("Razorpay API call error:", err);
      }
    }

    // Default response if keys are test/unconfigured/offline
    return NextResponse.json({
      success: true,
      orderId: simulatedOrderId,
      amount: amount,
      currency: "INR",
      keyId: keyId,
      isLive: false,
      hasLiveKeys: Boolean(
        keySecret &&
          keyId &&
          (keyId.startsWith("rzp_live_") || (keyId.startsWith("rzp_test_") && !keyId.includes("demokey")))
      ),
      pgName: pg.pgName,
      message: "Ready for payment gateway interaction.",
    });
  } catch (error) {
    console.error("Error in /api/payments/create-order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate payment order" },
      { status: 500 }
    );
  }
}
