import { NextRequest, NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import { pushNotification } from "@/lib/notifications/pushNotification";
import prisma from "@/prisma/connection";
import { UPLOADS_DIR } from "@/lib/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function removeUserFiles(userId: string) {
  const documents = await prisma.document.findMany({
    where: { authorId: userId },
    select: { fileKey: true },
  });
  await Promise.all(
    documents.map(async ({ fileKey }) => {
      try {
        const relative = fileKey.replace(/^\/+/, "");
        const absolute = path.resolve(UPLOADS_DIR, relative);
        if (absolute.startsWith(UPLOADS_DIR + path.sep)) {
          await rm(absolute, { force: true });
        }
      } catch {
        // best-effort
      }
    }),
  );
}

async function notifyUser(userId: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: "MODERATION",
      message,
      link: null,
      actorId: null,
    },
  });
  await pushNotification(userId, {
    id: notification.id,
    type: "MODERATION",
    message,
    link: null,
    actorId: null,
    createdAt: notification.createdAt,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isSuspended: true,
      suspendedAt: true,
      suspendedReason: true,
      emailVerified: true,
      _count: {
        select: { Document: true, comments: true, reviews: true },
      },
      Profile: { select: { institution: true, department: true, country: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [documents, likesReceived, savesReceived, adminActions] =
    await Promise.all([
      prisma.document.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          downloads: true,
          likes: true,
          createdAt: true,
        },
      }),
      prisma.document.aggregate({
        where: { authorId: userId },
        _sum: { likes: true },
      }),
      prisma.save.count({ where: { document: { authorId: userId } } }),
      prisma.adminAction.findMany({
        where: { targetType: "user", targetId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          actor: { select: { name: true, email: true } },
        },
      }),
    ]);

  return NextResponse.json({
    ...user,
    totalLikes: likesReceived._sum.likes ?? 0,
    savesReceived,
    documents,
    adminActions,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const body = await request.json().catch(() => null) ?? {};
  const name: unknown = body.name;
  const email: unknown = body.email;
  const password: unknown = body.password;
  const role: unknown = body.role;
  const suspend: unknown = body.suspend;
  const reason: unknown = body.reason;
  const verified: unknown = body.verified;

  const data: Prisma.UserUncheckedUpdateInput = {};

  let auditAction: string | null = null;
  let auditDetails: string | undefined;

  if (
    name !== undefined ||
    email !== undefined ||
    password !== undefined
  ) {
    auditAction = "user.update";

    if (name !== undefined) {
      data.name =
        typeof name === "string" && name.trim() ? name.trim() : null;
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
        return NextResponse.json(
          { error: "A valid email address is required" },
          { status: 400 },
        );
      }
      const existing = await prisma.user.findUnique({
        where: { email: email.trim() },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 },
        );
      }
      data.email = email.trim();
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 },
        );
      }
      data.password = await argon2.hash(password);
    }
  }

  if (role !== undefined && role !== "USER" && role !== "ADMIN") {
    return NextResponse.json(
      { error: 'role must be "USER" or "ADMIN"' },
      { status: 400 },
    );
  }

  if (role !== undefined && userId === session.user.id && role !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot demote your own account" },
      { status: 400 },
    );
  }

  if (suspend === true && userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot suspend your own account" },
      { status: 400 },
    );
  }

  if (role !== undefined && role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (target?.role === "ADMIN") {
        return NextResponse.json(
          { error: "Cannot demote the last administrator" },
          { status: 400 },
        );
      }
    }
  }

  if (role !== undefined) {
    data.role = role;
    auditAction = role === "ADMIN" ? "user.promote" : "user.demote";
  }

  if (suspend === true) {
    data.isSuspended = true;
    data.suspendedAt = new Date();
    data.suspendedReason =
      typeof reason === "string" && reason.trim()
        ? reason.trim()
        : "User suspended by an administrator";
    auditAction = "user.suspend";
    auditDetails =
      typeof reason === "string" && reason.trim() ? reason.trim() : undefined;
  } else if (suspend === false) {
    data.isSuspended = false;
    data.suspendedAt = null;
    data.suspendedReason = null;
    auditAction = "user.unsuspend";
  }

  if (typeof verified === "boolean" && verified !== undefined) {
    data.emailVerified = verified ? new Date() : null;
    auditAction = verified ? "user.verify" : "user.unverify";
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        role: true,
        isSuspended: true,
        suspendedReason: true,
        emailVerified: true,
      },
    });

    if (suspend === true) {
      await notifyUser(
        userId,
        `Your account was suspended. ${data.suspendedReason}`,
      );
    } else if (suspend === false) {
      await notifyUser(userId, "Your account suspension has been lifted.");
    }

    if (auditAction) {
      await recordAdminAction(session, auditAction, "user", userId, auditDetails);
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (target?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete the last administrator" },
        { status: 400 },
      );
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await removeUserFiles(userId);
    await prisma.user.delete({ where: { id: userId } });

    await recordAdminAction(session, "user.delete", "user", userId);
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Admin user delete failed:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
