import { NextRequest, NextResponse } from "next/server";
import { getPGApplications, updatePGApplicationStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const applications = await getPGApplications();

    const counts = {
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };

    return NextResponse.json({
      success: true,
      applications,
      counts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { pgId, status, rejectionReason } = body;

    if (!pgId || !status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters. 'pgId' and 'status' ('approved' | 'rejected') are required." },
        { status: 400 }
      );
    }

    const updated = await updatePGApplicationStatus(pgId, status, rejectionReason);

    return NextResponse.json({
      success: true,
      message: `PG application ${status} successfully!`,
      pg: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update application status" },
      { status: 400 }
    );
  }
}
