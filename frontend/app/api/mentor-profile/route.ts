import { NextRequest, NextResponse } from "next/server";
import { MentorApprovalStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import { parseJsonArray } from "@/app/api/mentors/browse/route";

/**
 * GET /api/mentor-profile
 * Returns the signed-in user's mentor profile (or null if none).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        bio: true,
        areas: true,
        yearsExperience: true,
        availability: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        areas: parseJsonArray(profile.areas),
      },
    });
  } catch (error) {
    console.error("Error fetching mentor profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentor profile" },
      { status: 500 },
    );
  }
}

function toAreasJson(areas: unknown): string {
  if (Array.isArray(areas) && areas.every((a) => typeof a === "string")) {
    return JSON.stringify(areas.slice(0, 10));
  }
  return "[]";
}

/**
 * POST /api/mentor-profile
 * Apply to be a mentor, or update an existing application. A fresh
 * application or a re-submission after rejection goes back to PENDING.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await request.json().catch(() => null);

    const title = String(body?.title ?? "").trim().slice(0, 120);
    const bio = String(body?.bio ?? "").trim().slice(0, 2000);
    const areas = toAreasJson(body?.areas);
    const yearsExperience = Number(body?.yearsExperience ?? 0);
    const availability = String(body?.availability ?? "").trim().slice(0, 200);

    if (!title) {
      return NextResponse.json(
        { error: "Professional title is required" },
        { status: 400 },
      );
    }
    if (body?.areas && !Array.isArray(body.areas)) {
      return NextResponse.json({ error: "areas must be an array" }, { status: 400 });
    }
    if (!Number.isFinite(yearsExperience) || yearsExperience < 0 || yearsExperience > 80) {
      return NextResponse.json(
        { error: "Years of experience must be between 0 and 80" },
        { status: 400 },
      );
    }

    const existing = await prisma.mentorProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    // Resubmissions (after rejection) go back to PENDING; approved mentors can
    // tweak their profile without losing approval.
    let status: MentorApprovalStatus = "PENDING";
    if (existing && existing.status === "APPROVED") {
      status = "APPROVED";
    }

    const profile = await prisma.mentorProfile.upsert({
      where: { userId },
      update: { title, bio, areas, yearsExperience, availability, status },
      create: {
        userId,
        title,
        bio,
        areas,
        yearsExperience,
        availability,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      profile: {
        id: profile.id,
        title: profile.title,
        bio: profile.bio,
        areas: parseJsonArray(profile.areas),
        yearsExperience: profile.yearsExperience,
        availability: profile.availability,
        status: profile.status,
      },
    });
  } catch (error) {
    console.error("Error saving mentor profile:", error);
    return NextResponse.json(
      { error: "Failed to save mentor profile" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/mentor-profile
 * Remove the signed-in user's mentor profile (no longer a mentor).
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.mentorProfile.deleteMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting mentor profile:", error);
    return NextResponse.json(
      { error: "Failed to delete mentor profile" },
      { status: 500 },
    );
  }
}