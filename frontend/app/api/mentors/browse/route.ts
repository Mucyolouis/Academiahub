import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

/**
 * GET /api/mentors/browse?q=
 * Browse approved, searchable mentors. Search matches name, title, bio or
 * areas. Relation status to the viewer is included so the UI can render the
 * correct "Request mentorship" button.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const viewerId = session.user.id;
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    const profiles = await prisma.mentorProfile.findMany({
      where: {
        status: "APPROVED",
        user: { isSuspended: false, showInSearch: true },
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { bio: { contains: q } },
                { areas: { contains: q } },
                { user: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            mentorshipsAsMentor: {
              where: { status: "ACTIVE" },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const mentors = await Promise.all(
      profiles.map(async (profile) => {
        const existing = await prisma.mentorshipRequest.findUnique({
          where: {
            mentorId_requesterId: {
              mentorId: profile.userId,
              requesterId: viewerId,
            },
          },
          select: { status: true },
        });

        let relationship: "none" | "pending-sent" | "pending-incoming" | "accepted" =
          "none";
        if (existing) {
          if (existing.status === "PENDING") {
            relationship = "pending-sent";
          } else if (existing.status === "ACTIVE") {
            relationship = "accepted";
          }
        }

        return {
          id: profile.id,
          title: profile.title,
          bio: profile.bio,
          areas: parseJsonArray(profile.areas),
          yearsExperience: profile.yearsExperience,
          availability: profile.availability,
          user: {
            id: profile.user.id,
            name: profile.user.name,
            image: profile.user.image,
          },
          mentorCount: profile.user.mentorshipsAsMentor.length,
          relationship,
        };
      }),
    );

    return NextResponse.json({ mentors });
  } catch (error) {
    console.error("Error browsing mentors:", error);
    return NextResponse.json({ error: "Failed to fetch mentors" }, { status: 500 });
  }
}

export function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }
  } catch {
    // fall through to empty
  }
  return [];
}