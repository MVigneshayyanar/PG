import { NextResponse } from "next/server";
import { getAllPGsDirectory } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const directory = await getAllPGsDirectory();
    return NextResponse.json({ success: true, pgs: directory });
  } catch (error: any) {
    console.error("Error in GET /api/pgs/directory:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load PG directory" },
      { status: 500 }
    );
  }
}
