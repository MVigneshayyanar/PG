import { NextRequest, NextResponse } from "next/server";
import { vacateTenantWithReview } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, rating, blackmark, comment, ownerName } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required." },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Please provide feedback/comments for the tenant vacating record." },
        { status: 400 }
      );
    }

    const result = await vacateTenantWithReview({
      tenantId,
      rating: Number(rating) || 5,
      blackmark: Boolean(blackmark),
      comment: comment.trim(),
      ownerName: ownerName || "PG Owner",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Vacate tenant error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to vacate tenant" },
      { status: 500 }
    );
  }
}
