import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { rm } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import { UPLOADS_DIR } from "@/lib/storage";

/**
 * GET /api/documents/:id
 * Get single document with author info + interaction status for current user.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;
    const userId = session.user.id;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        author: { select: { id: true, name: true, image: true } },
        communityLinks: {
          include: {
            community: {
              select: { id: true, name: true, slug: true, image: true },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Moderated documents are only visible to their author and admins.
    if (
      document.status === "HIDDEN" &&
      document.author.id !== userId &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const [liked, saved] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_documentId: { userId, documentId } },
      }),
      prisma.save.findUnique({
        where: { userId_documentId: { userId, documentId } },
      }),
    ]);

    return NextResponse.json({
      ...document,
      isLiked: !!liked,
      isSaved: !!saved,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/:id
 * Delete a document (author only). Removes the stored file best-effort,
 * then deletes the row — Prisma cascades clean up likes/comments/saves/etc.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { authorId: true, fileKey: true, fileUrl: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    after(() => {
      revalidatePath("/dashboard");
    });

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
