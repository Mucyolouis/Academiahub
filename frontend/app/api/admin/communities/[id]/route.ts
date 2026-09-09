import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import prisma from "@/prisma/connection";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: communityId } = await params;

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, name: true },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  await prisma.community.delete({ where: { id: communityId } });

  await recordAdminAction(
    session,
    "community.delete",
    "community",
    communityId,
    community.name,
  );

  return NextResponse.json({ message: "Community deleted" });
}