import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

/**
 * GET /api/mentorships/[id]/reviews
 * List reviews for a mentorship (visible to participants).
 *
 * POST /api/mentorships/[id]/reviews
 * Leave a 1-5 star review once the mentorship has ended/completed. The mentee
 * is the reviewer.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const mentorship = await prisma.mentorship.findUnique({
      where: { id },
      select: { id: true, mentorId: true, menteeId: true },
    });
    if (!mentorship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (
      mentorship.mentorId !== session.user.id &&
      mentorship.menteeId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reviews = await prisma.mentorshipReview.findMany({
      where: { mentorshipId: id },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching mentorship reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const rating = body?.rating;
    const content = String(body?.content ?? "").trim();

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id },
      select: {
        id: true,
        menteeId: true,
        mentorId: true,
        status: true,
      },
    });
    if (!mentorship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (mentorship.menteeId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the mentee can review this mentorship" },
        { status: 403 },
      );
    }
    if (mentorship.status === "ACTIVE") {
      return NextResponse.json(
        { error: "This mentorship has not ended yet" },
        { status: 400 },
      );
    }

    const existing = await prisma.mentorshipReview.findUnique({
      where: { mentorshipId_reviewerId: { mentorshipId: id, reviewerId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already reviewed this mentorship" },
        { status: 409 },
      );
    }

    const review = await prisma.mentorshipReview.create({
      data: {
        mentorshipId: id,
        reviewerId: session.user.id,
        rating,
        content: content.slice(0, 2000),
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating mentorship review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}