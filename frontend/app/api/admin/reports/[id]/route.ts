import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import prisma from "@/prisma/connection";

const ALLOWED_STATUSES = ["REVIEWED", "DISMISSED"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: reportId } = await params;
  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;

  if (
    typeof status !== "string" ||
    !ALLOWED_STATUSES.includes(status as AllowedStatus)
  ) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as AllowedStatus,
        resolvedById: session.user.id,
        resolvedAt: new Date(),
        resolution: status === "DISMISSED" ? "DISMISSED" : "NONE",
      },
      select: { id: true, status: true },
    });
    await recordAdminAction(
      session,
      status === "DISMISSED" ? "report.dismiss" : "report.resolve",
      "report",
      reportId,
    );
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
}
