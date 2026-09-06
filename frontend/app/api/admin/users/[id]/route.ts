import { NextRequest, NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin-guard";
import prisma from "@/prisma/connection";
import { UPLOADS_DIR } from "@/lib/storage";

async function removeUserFiles(userId: string) {
  const documents = await prisma.document.findMany({
    where: { authorId: userId },
    select: { fileKey: true },
  });
  await Promise.all(
    documents.map(async ({ fileKey }) => {
      try {
        const relative = fileKey.replace(/^\/+/, "");
        const absolute = path.resolve(UPLOADS_DIR, relative);
        if (absolute.startsWith(UPLOADS_DIR + path.sep)) {
          await rm(absolute, { force: true });
        }
      } catch {
        // best-effort
      }
    }),
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const body = await request.json().catch(() => null);
  const role = body?.role;

  if (role !== "USER" && role !== "ADMIN") {
    return NextResponse.json(
      { error: 'role must be "USER" or "ADMIN"' },
      { status: 400 },
    );
  }

  if (userId === session.user.id && role !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot demote your own account" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await removeUserFiles(userId);
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Admin user delete failed:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
