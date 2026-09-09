import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import { pushNotification } from "@/lib/notifications/pushNotification";

type Scope = "incoming" | "sent" | "accepted";

const VALID_SCOPES: Scope[] = ["incoming", "sent", "accepted"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const scopeParam = request.nextUrl.searchParams.get("scope") || "incoming";
    const scope: Scope = VALID_SCOPES.includes(scopeParam as Scope)
      ? (scopeParam as Scope)
      : "incoming";

    let status: "PENDING" | "ACCEPTED" = "PENDING";
    if (scope === "accepted") status = "ACCEPTED";

    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status,
        ...(scope === "incoming" ? { requesterId: { not: userId } } : {}),
        ...(scope === "sent" ? { requesterId: userId } : {}),
      },
      include: {
        userA: { select: { id: true, name: true, image: true } },
        userB: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = connections.map((conn) => {
      const other = conn.userAId === userId ? conn.userB : conn.userA;
      return {
        id: conn.id,
        status: conn.status as "PENDING" | "ACCEPTED",
        requesterId: conn.requesterId,
        user: other,
        createdAt: conn.createdAt,
      };
    });

    return NextResponse.json({ connections: result });
  } catch (error) {
    console.error("Error listing connections:", error);
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json().catch(() => null);
    const targetUserId =
      body && typeof body === "object" ? (body as { userId?: unknown }).userId : undefined;

    if (typeof targetUserId !== "string" || !targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: "You cannot connect with yourself" }, { status: 400 });
    }

    const targetExists = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [userAId, userBId] =
      userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];

    const existing = await prisma.connection.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true, status: true, requesterId: true },
    });

    if (existing && existing.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "You are already connected" },
        { status: 409 },
      );
    }

    if (existing && existing.status === "PENDING") {
      if (existing.requesterId === userId) {
        return NextResponse.json(
          { error: "Connection request already sent" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "They already sent you a request — accept it instead" },
        { status: 409 },
      );
    }

    // No row, or a previously REMOVED row → (re)send a fresh request.
    const connection = await prisma.connection.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: { status: "PENDING", requesterId: userId },
      create: { userAId, userBId, requesterId: userId, status: "PENDING" },
    });

    after(async () => {
      if (session.user.id) {
        const notification = await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: "CONNECTION_REQUEST",
            message: `${session.user.name || "Someone"} sent you a connection request`,
            actorId: userId,
            link: "/connections",
          },
        });
        await pushNotification(targetUserId, notification);
      }
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return NextResponse.json(
      { error: "Failed to send connection request" },
      { status: 500 },
    );
  }
}