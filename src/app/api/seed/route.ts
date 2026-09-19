import { NextResponse } from "next/server";
import { getAllPGsDirectory } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await getAllPGsDirectory();
    return NextResponse.json({
      success: true,
      message: "Data initialized successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Initialization error" },
      { status: 500 }
    );
  }
}
