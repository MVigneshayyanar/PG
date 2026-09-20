import { NextRequest, NextResponse } from "next/server";
import { getRooms, addRoom, updateRoom, getPG } from "@/lib/store";
import { SharingCategory } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get("pgId") || undefined;
    const rooms = await getRooms(pgId);
    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error("Error in GET /api/rooms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomNumber, category, rentAmount, pgId, amenities } = body;

    if (!roomNumber || !category || !rentAmount) {
      return NextResponse.json(
        { success: false, error: "Room number, category, and rent amount are required" },
        { status: 400 }
      );
    }

    const pg = await getPG(pgId);
    const capacity = parseInt(category, 10) || 1;

    const newRoom = await addRoom({
      pgId: pg.id,
      roomNumber: String(roomNumber).trim(),
      category: category as SharingCategory,
      capacity,
      rentAmount: Number(rentAmount),
      amenities: Array.isArray(amenities) ? amenities : [],
    });

    return NextResponse.json({ success: true, room: newRoom }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/rooms:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create room" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, roomNumber, category, rentAmount, amenities } = body;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      );
    }

    const updatedRoom = await updateRoom(roomId, {
      roomNumber: roomNumber ? String(roomNumber).trim() : undefined,
      category: category as SharingCategory,
      rentAmount: rentAmount !== undefined ? Number(rentAmount) : undefined,
      amenities: Array.isArray(amenities) ? amenities : undefined,
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error("Error in PUT /api/rooms:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update room" },
      { status: 400 }
    );
  }
}

