import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

/**
 * PATCH /api/mentorships/[id]
 * End or complete an active mentorship. Either participant may do so.
 * Body: { action: "end" | "complete" }
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

    if (action !== "end" && action !== "complete") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id },
      select: { id: true, mentorId: true, menteeId: true, status: true },
    });
    if (!mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }
    if (
      mentorship.mentorId !== session.user.id &&
      mentorship.menteeId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (mentorship.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This mentorship is no longer active" },
        { status: 409 },
      );
    }

    const nextStatus = action === "complete" ? "COMPLETED" : "ENDED";
    await prisma.mentorship.update({
      where: { id },
      data: { status: nextStatus, endedAt: new Date() },
    });

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error) {
    console.error("Error ending mentorship:", error);
    return NextResponse.json(
      { error: "Failed to update mentorship" },
      { status: 500 },
    );
  }
}