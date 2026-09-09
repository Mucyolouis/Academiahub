import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import type { Prisma } from "@prisma/client";

const SORT_OPTIONS: Record<string, Prisma.DocumentFindManyArgs["orderBy"]> = {
  recent: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  popular: [{ likes: "desc" }, { createdAt: "desc" }],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));

    const community = await prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const where: Prisma.DocumentWhereInput = {
      communityLinks: { some: { communityId: community.id } },
      status: "PUBLISHED",
    };

    const skip = (page - 1) * limit;

    const [documents, total, session] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { commentRecords: { where: { isHidden: false } } },
          },
        },
        orderBy: SORT_OPTIONS[sort] ?? SORT_OPTIONS.recent,
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
      getServerSession(authOptions),
    ]);

    const userId = session?.user?.id;
    let documentsWithUserState: Array<
      (typeof documents)[number] & { isLiked?: boolean; isSaved?: boolean }
    > = documents;

    if (userId && documents.length > 0) {
      const documentIds = documents.map((d) => d.id);
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({
          where: { userId, documentId: { in: documentIds } },
          select: { documentId: true },
        }),
        prisma.save.findMany({
          where: { userId, documentId: { in: documentIds } },
          select: { documentId: true },
        }),
      ]);
      const likedSet = new Set(likes.map((l) => l.documentId));
      const savedSet = new Set(saves.map((s) => s.documentId));
      documentsWithUserState = documents.map((d) => ({
        ...d,
        isLiked: likedSet.has(d.id),
        isSaved: savedSet.has(d.id),
      }));
    }

    return NextResponse.json({
      documents: documentsWithUserState,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching community documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch community documents" },
      { status: 500 },
    );
  }
}