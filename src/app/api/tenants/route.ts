import { NextRequest, NextResponse } from "next/server";
import { getTenants, addTenant, getPG } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;
    const tenants = await getTenants(pgId);
    return NextResponse.json({ success: true, tenants });
  } catch (error) {
    console.error("Error in GET /api/tenants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phoneNumber, roomId, pgId } = body;

    if (!name || !phoneNumber || !roomId) {
      return NextResponse.json(
        { success: false, error: "Name, phone number, and room assignment are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
    const pg = await getPG(pgId);

    // Minimal fields per spec: name + phoneNumber + assigned room
    const newTenant = await addTenant({
      pgId: pg.id,
      roomId,
      name: name.trim(),
      phoneNumber: cleanPhone,
    });

    return NextResponse.json({
      success: true,
      message: "Tenant added successfully with current month rent marked as pending.",
      tenant: newTenant,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tenants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add tenant" },
      { status: 500 }
    );
  }
}
