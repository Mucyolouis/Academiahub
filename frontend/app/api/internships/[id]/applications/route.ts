import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

/**
 * GET /api/internships/[id]/applications
 * List applications for an internship. Poster or admin only.
 *
 * POST /api/internships/[id]/applications
 * Apply to an internship with a cover letter and optional resume.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const internship = await prisma.internship.findUnique({
      where: { id },
      select: { postedById: true },
    });
    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }
    if (
      internship.postedById !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const applications = await prisma.internshipApplication.findMany({
      where: { internshipId: id },
      include: {
        applicant: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error listing applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const applicantId = session.user.id;
    const { id } = await params;

    const internship = await prisma.internship.findUnique({
      where: { id },
      select: {
        id: true,
        postedById: true,
        status: true,
        hidden: true,
        applicationDeadline: true,
      },
    });
    if (!internship || internship.hidden) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }
    if (internship.postedById === applicantId) {
      return NextResponse.json(
        { error: "You cannot apply to your own internship" },
        { status: 400 },
      );
    }
    if (internship.status !== "OPEN") {
      return NextResponse.json(
        { error: "This internship is no longer accepting applications" },
        { status: 400 },
      );
    }
    if (
      internship.applicationDeadline &&
      internship.applicationDeadline.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "The application deadline has passed" },
        { status: 400 },
      );
    }

    const existing = await prisma.internshipApplication.findUnique({
      where: { internshipId_applicantId: { internshipId: id, applicantId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already applied to this internship" },
        { status: 409 },
      );
    }

    const body = await request.json().catch(() => null);
    const coverLetter = String(body?.coverLetter ?? "").trim();
    const resumeUrl =
      typeof body?.resumeUrl === "string" && body.resumeUrl.trim()
        ? body.resumeUrl.trim().slice(0, 500)
        : null;
    const resumeName =
      typeof body?.resumeName === "string" && body.resumeName.trim()
        ? body.resumeName.trim().slice(0, 200)
        : null;

    if (!coverLetter) {
      return NextResponse.json(
        { error: "A cover letter is required" },
        { status: 400 },
      );
    }
    if (coverLetter.length > 10000) {
      return NextResponse.json(
        { error: "Cover letter is too long" },
        { status: 400 },
      );
    }

    const application = await prisma.internshipApplication.create({
      data: {
        internshipId: id,
        applicantId,
        coverLetter,
        resumeUrl,
        resumeName,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error applying to internship:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}