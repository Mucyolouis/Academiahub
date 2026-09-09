import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: {
          take: 12,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { members: true, documents: true } },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    let isMember = false;
    if (userId) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: { communityId: community.id, userId },
        },
        select: { id: true },
      });
      isMember = !!membership;
    }

    return NextResponse.json({ community: { ...community, isMember } });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
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

    const community = await prisma.community.findUnique({ where: { slug } });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the community owner can edit it" },
        { status: 403 },
      );
    }

    const { name, description, image } = body;

    if (typeof name === "string" && name.trim().length < 3) {
      return NextResponse.json(
        { error: "Community name must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (typeof description === "string" && description.trim().length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 },
      );
    }

    const updated = await prisma.community.update({
      where: { id: community.id },
      data: {
        ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
        ...(typeof description === "string" && description.trim()
          ? { description: description.trim() }
          : {}),
        ...(typeof image === "string"
          ? { image: image.trim() || null }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json(
      { error: "Failed to update community" },
      { status: 500 },
    );
  }
}