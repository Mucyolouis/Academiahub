import { NextRequest, NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import prisma from "@/prisma/connection";
import { UPLOADS_DIR } from "@/lib/storage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: documentId } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (status !== "PUBLISHED" && status !== "HIDDEN") {
    return NextResponse.json(
      { error: 'status must be "PUBLISHED" or "HIDDEN"' },
      { status: 400 },
    );
  }

  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: { status, hiddenAt: status === "HIDDEN" ? new Date() : null },
      select: { id: true, title: true, status: true },
    });
    await recordAdminAction(
      session,
      status === "HIDDEN" ? "document.hide" : "document.publish",
      "document",
      documentId,
      document.title,
    );
    return NextResponse.json(document);
  } catch {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
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

  const { id: documentId } = await params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, fileKey: true, title: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    try {
      const relative = document.fileKey.replace(/^\/+/, "");
      const absolute = path.resolve(UPLOADS_DIR, relative);
      if (absolute.startsWith(UPLOADS_DIR + path.sep)) {
        await rm(absolute, { force: true });
      }
    } catch (fileErr) {
      console.error("Failed to remove stored file", document.fileKey, fileErr);
    }

    await prisma.document.delete({ where: { id: documentId } });

    await recordAdminAction(
      session,
      "document.delete",
      "document",
      documentId,
      document.title,
    );
    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Admin document delete failed:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
