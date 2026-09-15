import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import prisma from "@/prisma/connection";

/**
 * PATCH /api/admin/internships/[id]
 * Body: { hidden: boolean }
 * Hide or restore an internship listing behind the admin guard.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const hidden = body?.hidden;

  if (typeof hidden !== "boolean") {
    return NextResponse.json({ error: "hidden must be a boolean" }, { status: 400 });
  }

  const internship = await prisma.internship.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!internship) {
    return NextResponse.json({ error: "Internship not found" }, { status: 404 });
  }

  const updated = await prisma.internship.update({
    where: { id },
    data: { hidden, hiddenAt: hidden ? new Date() : null },
  });

  await recordAdminAction(
    session,
    hidden ? "hide_internship" : "unhide_internship",
    "Internship",
    id,
    internship.title,
  );

  return NextResponse.json({ internship: updated });
}

/**
 * DELETE /api/admin/internships/[id]
 * Delete an internship listing permanently.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const internship = await prisma.internship.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!internship) {
    return NextResponse.json({ error: "Internship not found" }, { status: 404 });
  }

  await prisma.internship.delete({ where: { id } });
  await recordAdminAction(
    session,
    "delete_internship",
    "Internship",
    id,
    internship.title,
  );

  return NextResponse.json({ ok: true });
}