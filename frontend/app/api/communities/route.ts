import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import type { Prisma } from "@prisma/client";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const joinedOnly = searchParams.get("joined") === "true";
    const [pageStr, limitStr] = [searchParams.get("page"), searchParams.get("limit")];
    const page = Math.max(1, parseInt(pageStr || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(limitStr || "12")));

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const where: Prisma.CommunityWhereInput = q?.trim()
      ? {
          OR: [
            { name: { contains: q.trim() } },
            { description: { contains: q.trim() } },
          ],
        }
      : {};

    if (joinedOnly && userId) {
      where.members = { some: { userId } };
    }

    const skip = (page - 1) * limit;

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, image: true } },
          _count: { select: { members: true, documents: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.community.count({ where }),
    ]);

    let result = communities;

    if (userId && communities.length > 0) {
      const communityIds = communities.map((c) => c.id);
      const memberships = await prisma.communityMember.findMany({
        where: { userId, communityId: { in: communityIds } },
        select: { communityId: true },
      });
      const memberSet = new Set(memberships.map((m) => m.communityId));
      result = communities.map((c) => ({
        ...c,
        isMember: memberSet.has(c.id),
      })) as typeof communities;
    }

    return NextResponse.json({
      communities: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      request.json().catch(() => null),
    ]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { name, description, image } = body;

    if (typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Community name must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 },
      );
    }

    const baseSlug = slugify(name);
    if (!baseSlug) {
      return NextResponse.json(
        { error: "Community name must contain letters or numbers" },
        { status: 400 },
      );
    }

    // Ensure the slug is unique by appending a numeric suffix if needed.
    let slug = baseSlug;
    let counter = 2;
    while (await prisma.community.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const community = await prisma.$transaction(async (tx) => {
      const created = await tx.community.create({
        data: {
          name: name.trim(),
          slug,
          description: description.trim(),
          image: typeof image === "string" && image.trim() ? image.trim() : null,
          ownerId: session.user.id,
        },
      });

      // The owner is automatically a member of their community.
      await tx.communityMember.create({
        data: { communityId: created.id, userId: session.user.id },
      });

      return created;
    });

    return NextResponse.json(community, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 500 },
    );
  }
}