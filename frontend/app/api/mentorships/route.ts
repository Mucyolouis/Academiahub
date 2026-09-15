import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import { pushNotification } from "@/lib/notifications/pushNotification";

const ACTIVE_STATUSES = ["ACTIVE", "COMPLETED", "ENDED"] as const;

/**
 * GET /api/mentorships
 * Returns the mentorship overview for the signed-in user:
 * incoming requests (mentee → me), requests I sent, and active mentorships.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const [incoming, sent, active, asMentor] = await Promise.all([
      prisma.mentorshipRequest.findMany({
        where: { mentorId: userId, status: "PENDING" },
        include: {
          requester: {
            select: { id: true, name: true, image: true },
          },
          mentor: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mentorshipRequest.findMany({
        where: { requesterId: userId, status: "PENDING" },
        include: {
          requester: {
            select: { id: true, name: true, image: true },
          },
          mentor: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mentorship.findMany({
        where: {
          OR: [{ menteeId: userId }, { mentorId: userId }],
          status: "ACTIVE",
        },
        include: {
          mentor: { select: { id: true, name: true, image: true } },
          mentee: { select: { id: true, name: true, image: true } },
        },
        orderBy: { startedAt: "desc" },
      }),
      prisma.mentorship.findMany({
        where: { mentorId: userId, status: "ACTIVE" },
        include: {
          mentor: { select: { id: true, name: true, image: true } },
          mentee: { select: { id: true, name: true, image: true } },
        },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      incoming,
      sent,
      active,
      asMentor,
    });
  } catch (error) {
    console.error("Error listing mentorships:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentorships" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/mentorships
 * Send a mentorship request to an approved mentor. Body: { mentorId, topic, message }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requesterId = session.user.id;
    const body = await request.json().catch(() => null);
    const mentorId =
      body && typeof body === "object" && typeof body.mentorId === "string"
        ? body.mentorId
        : undefined;

    if (!mentorId) {
      return NextResponse.json(
        { error: "mentorId is required" },
        { status: 400 },
      );
    }
    if (mentorId === requesterId) {
      return NextResponse.json(
        { error: "You cannot mentor yourself" },
        { status: 400 },
      );
    }

    const profile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorId },
      select: { status: true },
    });
    if (!profile || profile.status !== "APPROVED") {
      return NextResponse.json(
        { error: "This user is not an approved mentor" },
        { status: 400 },
      );
    }

    const topic = String(body.topic ?? "").trim().slice(0, 120);
    const message = String(body.message ?? "").trim().slice(0, 2000);
    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.mentorshipRequest.findUnique({
      where: {
        mentorId_requesterId: { mentorId, requesterId },
      },
      select: { status: true },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return NextResponse.json(
          { error: "You already sent this mentor a request" },
          { status: 409 },
        );
      }
      if (ACTIVE_STATUSES.includes(existing.status as (typeof ACTIVE_STATUSES)[number])) {
        return NextResponse.json(
          { error: "You are already in a mentorship with this user" },
          { status: 409 },
        );
      }
    }

    const created = await prisma.mentorshipRequest.create({
      data: { mentorId, requesterId, topic, message, status: "PENDING" },
    });

    after(async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: mentorId,
          type: "MENTORSHIP_REQUEST",
          message: `${session.user.name || "Someone"} requested mentorship on "${topic}"`,
          actorId: requesterId,
          link: "/mentorship",
        },
      });
      await pushNotification(mentorId, notification);
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("Error sending mentorship request:", error);
    return NextResponse.json(
      { error: "Failed to send mentorship request" },
      { status: 500 },
    );
  }
}