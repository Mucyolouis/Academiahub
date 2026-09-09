import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import { pushNotification } from "@/lib/notifications/pushNotification";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: connectionId } = await params;
    const body = await request.json().catch(() => null);
    const action =
      body && typeof body === "object" ? (body as { action?: unknown }).action : undefined;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: { id: true, status: true, requesterId: true, userAId: true, userBId: true },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const isParticipant = connection.userAId === userId || connection.userBId === userId;
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const otherId = connection.userAId === userId ? connection.userBId : connection.userAId;

    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request is no longer pending" },
        { status: 409 },
      );
    }

    if (connection.requesterId === userId) {
      return NextResponse.json(
        { error: "You cannot respond to your own request" },
        { status: 403 },
      );
    }

    const updated = await prisma.connection.update({
      where: { id: connection.id },
      data: { status: action === "accept" ? "ACCEPTED" : "REMOVED" },
    });

    after(async () => {
      if (action === "accept" && session.user.id) {
        const notification = await prisma.notification.create({
          data: {
            userId: otherId,
            type: "CONNECTION_ACCEPTED",
            message: `${session.user.name || "Someone"} accepted your connection request`,
            actorId: userId,
            link: "/connections",
          },
        });
        await pushNotification(otherId, notification);
      }
    });

    return NextResponse.json({ connection: updated });
  } catch (error) {
    console.error("Error responding to connection request:", error);
    return NextResponse.json(
      { error: "Failed to update connection request" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: connectionId } = await params;

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: { id: true, status: true, requesterId: true, userAId: true, userBId: true },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const isParticipant = connection.userAId === userId || connection.userBId === userId;
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isPendingRequestByMe =
      connection.status === "PENDING" && connection.requesterId === userId;
    const isAcceptedConnection = connection.status === "ACCEPTED";

    if (isPendingRequestByMe) {
      // Cancel an outgoing pending request.
      await prisma.connection.update({
        where: { id: connection.id },
        data: { status: "REMOVED" },
      });
      return NextResponse.json({ message: "Request cancelled" });
    }

    if (isAcceptedConnection) {
      // Either party can remove an accepted connection.
      await prisma.connection.update({
        where: { id: connection.id },
        data: { status: "REMOVED" },
      });
      return NextResponse.json({ message: "Connection removed" });
    }

    return NextResponse.json(
      { error: "Nothing to remove" },
      { status: 409 },
    );
  } catch (error) {
    console.error("Error removing connection:", error);
    return NextResponse.json({ error: "Failed to remove connection" }, { status: 500 });
  }
}