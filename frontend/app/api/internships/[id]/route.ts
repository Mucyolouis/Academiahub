import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

const VALID_TYPES = ["REMOTE", "ONSITE", "HYBRID"];
const VALID_STATUS = ["OPEN", "CLOSED", "FILLED"];

/**
 * GET /api/internships/[id]
 * Detail for one internship. Hidden internships only resolve for the owner
 * or an admin. Includes the viewer's application status and ownership flag.
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
    const viewerId = session.user.id;
    const { id } = await params;

    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        postedBy: { select: { id: true, name: true, image: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = internship.postedById === viewerId;

    if (internship.hidden && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    let myApplication: string | null = null;
    if (!isOwner) {
      const application = await prisma.internshipApplication.findUnique({
        where: {
          internshipId_applicantId: { internshipId: id, applicantId: viewerId },
        },
        select: { status: true },
      });
      myApplication = application?.status ?? null;
    }

    return NextResponse.json({
      internship: {
        ...internship,
        myApplication,
        isOwner,
      },
    });
  } catch (error) {
    console.error("Error fetching internship:", error);
    return NextResponse.json({ error: "Failed to fetch internship" }, { status: 500 });
  }
}

/**
 * PATCH /api/internships/[id]
 * Update a listing. Only the poster or an admin.
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
    const internship = await prisma.internship.findUnique({
      where: { id },
      select: { postedById: true },
    });
    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }
    const isOwner = internship.postedById === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    const data: Record<string, unknown> = {};
    if (typeof body?.title === "string") data.title = body.title.trim().slice(0, 200);
    if (typeof body?.company === "string") data.company = body.company.trim().slice(0, 200);
    if (typeof body?.description === "string")
      data.description = body.description.trim().slice(0, 10000);
    if (body?.type && VALID_TYPES.includes(body.type as string)) data.type = body.type;
    if (typeof body?.location === "string") data.location = body.location.trim().slice(0, 200);
    if (typeof body?.duration === "string") data.duration = body.duration.trim().slice(0, 120);
    if (typeof body?.stipend === "string") data.stipend = body.stipend.trim().slice(0, 120);
    if (body?.status && VALID_STATUS.includes(body.status as string)) {
      data.status = body.status;
    }
    if (body?.applicationDeadline !== undefined) {
      if (body.applicationDeadline === null) {
        data.applicationDeadline = null;
      } else {
        const parsed = new Date(body.applicationDeadline as string);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
        }
        data.applicationDeadline = parsed;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.internship.update({
      where: { id },
      data,
    });

    return NextResponse.json({ internship: updated });
  } catch (error) {
    console.error("Error updating internship:", error);
    return NextResponse.json({ error: "Failed to update internship" }, { status: 500 });
  }
}

/**
 * DELETE /api/internships/[id]
 * Delete a listing. Only the poster or an admin.
 */
export async function DELETE(
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
    const isOwner = internship.postedById === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.internship.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting internship:", error);
    return NextResponse.json({ error: "Failed to delete internship" }, { status: 500 });
  }
}