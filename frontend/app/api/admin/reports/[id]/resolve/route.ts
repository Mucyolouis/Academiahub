import { NextRequest, NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import { pushNotification } from "@/lib/notifications/pushNotification";
import prisma from "@/prisma/connection";
import { UPLOADS_DIR } from "@/lib/storage";

const RESOLUTIONS = [
  "DELETED",
  "HIDDEN",
  "WARNED",
  "SUSPENDED",
  "DISMISSED",
] as const;
type Resolution = (typeof RESOLUTIONS)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminSession = session;

  const { id: reportId } = await params;
  const body = await request.json().catch(() => null);
  const resolution = body?.resolution as Resolution | null | undefined;
  const note: unknown = body?.note;

  if (
    typeof resolution !== "string" ||
    !RESOLUTIONS.includes(resolution as Resolution)
  ) {
    return NextResponse.json(
      { error: `resolution must be one of: ${RESOLUTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      document: { include: { author: { select: { id: true } } } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (report.status !== "PENDING") {
    return NextResponse.json(
      { error: "Report was already resolved" },
      { status: 409 },
    );
  }

  const document = report.document;
  const authorId = document.author.id;

  async function notifyAuthor(message: string, link: string | null) {
    if (!authorId) return;
    const notification = await prisma.notification.create({
      data: {
        userId: authorId,
        type: "MODERATION",
        message,
        link,
        actorId: adminSession.user.id,
      },
    });
    await pushNotification(authorId, {
      id: notification.id,
      type: "MODERATION",
      message,
      link,
      actorId: adminSession.user.id,
      createdAt: notification.createdAt,
    });
  }

  const docLink = `/publication/${document.id}`;

  // Resolve the report first: its `document` relation cascades on delete, so
  // deleting the doc afterwards would otherwise wipe the report row.
  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: resolution === "DISMISSED" ? "DISMISSED" : "REVIEWED",
      resolution,
      resolvedAt: new Date(),
      resolvedById: adminSession.user.id,
    },
  });

  try {
    if (resolution === "DELETED") {
      const relative = document.fileKey.replace(/^\/+/, "");
      const absolute = path.resolve(UPLOADS_DIR, relative);
      if (absolute.startsWith(UPLOADS_DIR + path.sep)) {
        await rm(absolute, { force: true });
      }
      await prisma.document.delete({ where: { id: document.id } });
      await notifyAuthor(
        note
          ? `Your publication "${document.title}" was removed. ${note}`
          : `Your publication "${document.title}" was removed by a moderator.`,
        null,
      );
    } else if (resolution === "HIDDEN") {
      await prisma.document.update({
        where: { id: document.id },
        data: { status: "HIDDEN", hiddenAt: new Date() },
      });
      await notifyAuthor(
        note
          ? `Your publication "${document.title}" was hidden. ${note}`
          : `Your publication "${document.title}" was hidden by a moderator.`,
        docLink,
      );
    } else if (resolution === "WARNED") {
      await notifyAuthor(
        note
          ? `You received a moderation warning. ${note}`
          : "You received a moderation warning regarding one of your publications.",
        docLink,
      );
    } else if (resolution === "SUSPENDED") {
      await prisma.user.update({
        where: { id: authorId },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: note || "Repeated violations of community guidelines",
        },
      });
      await notifyAuthor(
        note
          ? `Your account was suspended. ${note}`
          : "Your account was suspended due to repeated violations of community guidelines.",
        null,
      );
    }

    await recordAdminAction(
      session,
      `report.${resolution.toLowerCase()}`,
      "report",
      reportId,
      typeof note === "string" && note ? note : undefined,
    );

    return NextResponse.json({ message: `Report ${resolution.toLowerCase()}` });
  } catch (error) {
    console.error("Report resolve failed:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}