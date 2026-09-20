import { NextRequest, NextResponse } from "next/server";
import { getTickets, createTicket } from "@/lib/store";
import { TicketCategory, TicketStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;
    const status = (searchParams.get("status") as TicketStatus) || undefined;

    const tickets = await getTickets(pgId, status);
    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error("Error in GET /api/tickets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, tenantName, phoneNumber, pgId, roomId, roomNumber, title, description, category } = body;

    if (!tenantId || !title || !description) {
      return NextResponse.json(
        { success: false, error: "Tenant ID, title, and description are required" },
        { status: 400 }
      );
    }

    const ticket = await createTicket({
      tenantId,
      tenantName: tenantName || "Tenant",
      phoneNumber: phoneNumber || "",
      pgId: pgId || "pg-sri-sai-01",
      roomId: roomId || "room-101",
      roomNumber: roomNumber || "101",
      title,
      description,
      category: (category as TicketCategory) || "Maintenance",
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tickets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
