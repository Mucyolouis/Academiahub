import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

export type ConnectionStatusValue =
  | "none"
  | "pending-sent"
  | "pending-incoming"
  | "accepted";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const otherUserId = request.nextUrl.searchParams.get("userId");

    if (!otherUserId || typeof otherUserId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (otherUserId === userId) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const [userAId, userBId] =
      userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

    const connection = await prisma.connection.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      select: { id: true, status: true, requesterId: true },
    });

    if (!connection) {
      return NextResponse.json({ status: "none" as const, connectionId: null });
    }

    if (connection.status === "ACCEPTED") {
      return NextResponse.json({
        status: "accepted" as const,
        connectionId: connection.id,
      });
    }

    if (connection.requesterId === userId) {
      return NextResponse.json({
        status: "pending-sent" as const,
        connectionId: connection.id,
      });
    }

    return NextResponse.json({
      status: "pending-incoming" as const,
      connectionId: connection.id,
    });
  } catch (error) {
    console.error("Error fetching connection status:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}