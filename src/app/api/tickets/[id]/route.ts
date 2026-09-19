import { NextRequest, NextResponse } from "next/server";
import { resolveTicket } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const updatedTicket = await resolveTicket(ticketId);

    if (!updatedTicket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket marked as resolved",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Error in PATCH /api/tickets/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
