import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import prisma from "@/prisma/connection";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: reviewId } = await params;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, isHidden: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: !review.isHidden },
    select: { id: true, isHidden: true },
  });

  await recordAdminAction(
    session,
    updated.isHidden ? "review.hide" : "review.show",
    "review",
    reviewId,
  );

  return NextResponse.json(updated);
}