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

  const { id: commentId } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, isHidden: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { isHidden: !comment.isHidden },
    select: { id: true, isHidden: true },
  });

  await recordAdminAction(
    session,
    updated.isHidden ? "comment.hide" : "comment.show",
    "comment",
    commentId,
  );

  return NextResponse.json(updated);
}