import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import { pushNotification } from "@/lib/notifications/pushNotification";

/**
 * PATCH /api/mentorships/requests/[id]
 * Body: { action: "accept" | "decline" }
 * The mentor accepts or declines an incoming mentorship request. Accepting
 * creates the active Mentorship record and notifies the requester.
 */
export async function PATCH(
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
    const action =
      body && typeof body === "object" ? (body as { action?: unknown }).action : undefined;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const existing = await prisma.mentorshipRequest.findUnique({
      where: { id },
      select: {
        id: true,
        mentorId: true,
        requesterId: true,
        topic: true,
        status: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (existing.mentorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the mentor can respond to this request" },
        { status: 403 },
      );
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request was already answered" },
        { status: 409 },
      );
    }

    let requesterName: string | null = null;

    if (action === "accept") {
      await prisma.$transaction([
        prisma.mentorshipRequest.update({
          where: { id },
          data: { status: "ACTIVE" },
        }),
        prisma.mentorship.create({
          data: {
            mentorId: existing.mentorId,
            menteeId: existing.requesterId,
            topic: existing.topic,
            status: "ACTIVE",
          },
        }),
      ]);

      const requester = await prisma.user.findUnique({
        where: { id: existing.requesterId },
        select: { name: true },
      });
      requesterName = requester?.name ?? null;

      after(async () => {
        const notification = await prisma.notification.create({
          data: {
            userId: existing.requesterId,
            type: "MENTORSHIP_ACCEPTED",
            message: `${session.user.name || "A mentor"} accepted your mentorship request`,
            actorId: existing.mentorId,
            link: "/mentorship",
          },
        });
        await pushNotification(existing.requesterId, notification);
      });
    } else {
      await prisma.mentorshipRequest.update({
        where: { id },
        data: { status: "DECLINED" },
      });
    }

    return NextResponse.json({
      ok: true,
      status: action === "accept" ? "ACTIVE" : "DECLINED",
      requesterName,
    });
  } catch (error) {
    console.error("Error responding to mentorship request:", error);
    return NextResponse.json(
      { error: "Failed to update mentorship request" },
      { status: 500 },
    );
  }
}