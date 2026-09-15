import { NextRequest, NextResponse, after } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import prisma from "@/prisma/connection";
import { pushNotification } from "@/lib/notifications/pushNotification";

const VALID_STATUSES = ["APPROVED", "REJECTED", "DEACTIVATED"];

/**
 * PATCH /api/admin/mentor-profiles/[id]
 * Body: { status: "APPROVED" | "REJECTED" | "DEACTIVATED" }
 * Approve, reject or deactivate a mentor application. Notifies the user.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status =
    body && typeof body === "object" ? (body as { status?: unknown }).status : undefined;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, title: true, status: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const updated = await prisma.mentorProfile.update({
    where: { id },
    data: { status: status as "APPROVED" | "REJECTED" | "DEACTIVATED" },
  });

  await recordAdminAction(
    session,
    status === "APPROVED"
      ? "approve_mentor"
      : status === "REJECTED"
        ? "reject_mentor"
        : "deactivate_mentor",
    "MentorProfile",
    id,
    profile.title,
  );

  after(async () => {
    const notification = await prisma.notification.create({
      data: {
        userId: profile.userId,
        type:
          status === "APPROVED"
            ? "MENTOR_PROFILE_APPROVED"
            : "MENTOR_PROFILE_REJECTED",
        message:
          status === "APPROVED"
            ? "Congratulations! Your mentor profile has been approved."
            : "Your mentor profile application was not approved.",
        actorId: session.user.id,
        link: "/mentorship",
      },
    });
    await pushNotification(profile.userId, notification);
  });

  return NextResponse.json({ profile: updated });
}

/**
 * DELETE /api/admin/mentor-profiles/[id]
 * Remove a mentor profile entirely.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const profile = await prisma.mentorProfile.findUnique({
    where: { id },
    select: { id: true, title: true, userId: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  await prisma.mentorProfile.delete({ where: { id } });
  await recordAdminAction(
    session,
    "delete_mentor_profile",
    "MentorProfile",
    id,
    profile.title,
  );

  return NextResponse.json({ ok: true });
}