import { NextRequest, NextResponse, after } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import { pushNotification } from "@/lib/notifications/pushNotification";

const VALID_STATUS: ApplicationStatus[] = [
  "PENDING",
  "SHORTLISTED",
  "ACCEPTED",
  "REJECTED",
];

/**
 * PATCH /api/internships/[id]/applications/[applicationId]
 * Update an application's status (shortlist / accept / reject). Poster or
 * admin only. Accept/reject notify the applicant.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, applicationId } = await params;

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

    const body = await request.json().catch(() => null);
    const rawStatus =
      body && typeof body === "object" ? (body as { status?: unknown }).status : undefined;
    if (typeof rawStatus !== "string" || !VALID_STATUS.includes(rawStatus as ApplicationStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const status = rawStatus as ApplicationStatus;

    const application = await prisma.internshipApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, internshipId: true, applicantId: true, status: true },
    });
    if (!application || application.internshipId !== id) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const updated = await prisma.internshipApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    if (status === "ACCEPTED" || status === "REJECTED") {
      after(async () => {
        const notification = await prisma.notification.create({
          data: {
            userId: application.applicantId,
            type: status === "ACCEPTED" ? "INTERNSHIP_ACCEPTED" : "INTERNSHIP_REJECTED",
            message:
              status === "ACCEPTED"
                ? "Congratulations! Your internship application has been accepted."
                : "Your internship application was not accepted.",
            actorId: session.user.id,
            link: "/internships/my-applications",
          },
        });
        await pushNotification(application.applicantId, notification);
      });
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}