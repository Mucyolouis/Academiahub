import { NextRequest, NextResponse } from "next/server";
import { MentorApprovalStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-guard";
import prisma from "@/prisma/connection";

export const VALID_MENTOR_STATUSES: MentorApprovalStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "DEACTIVATED",
];

/**
 * GET /api/admin/mentor-profiles?status=PENDING
 * List mentor profile applications, pending first by default.
 */
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusParam = request.nextUrl.searchParams.get("status") ?? "PENDING";
  const status: MentorApprovalStatus =
    VALID_MENTOR_STATUSES.includes(statusParam as MentorApprovalStatus)
      ? (statusParam as MentorApprovalStatus)
      : "PENDING";

  const profiles = await prisma.mentorProfile.findMany({
    where: { status },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isSuspended: true,
          showInSearch: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ profiles });
}