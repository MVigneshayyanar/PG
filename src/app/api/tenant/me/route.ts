import { NextRequest, NextResponse } from "next/server";
import { getTenantByPhone, getTenants, getRooms, getPG, getTenantPayments, getTenantTickets } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const tenantId = searchParams.get("tenantId");

    let tenant = null;

    if (tenantId) {
      const allTenants = await getTenants();
      tenant = allTenants.find((t) => t.id === tenantId) || null;
    } else if (phone) {
      tenant = await getTenantByPhone(phone);
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    const pg = await getPG(tenant.pgId);
    const rooms = await getRooms(tenant.pgId);
    const room = rooms.find((r) => r.id === tenant.roomId);
    const payments = await getTenantPayments(tenant.id);
    const tickets = await getTenantTickets(tenant.id);

    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        roomNumber: room?.roomNumber || tenant.roomNumber || "N/A",
        rentAmount: room?.rentAmount || tenant.rentAmount || 0,
        sharingCategory: room?.category || tenant.sharingCategory || "1",
      },
      room,
      pg: {
        id: pg.id,
        pgName: pg.pgName,
        location: pg.location,
        razorpayKeyId: pg.razorpay?.keyId || "",
      },
      payments,
      tickets,
    });
  } catch (error) {
    console.error("Error in GET /api/tenant/me:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenant profile" },
      { status: 500 }
    );
  }
}
