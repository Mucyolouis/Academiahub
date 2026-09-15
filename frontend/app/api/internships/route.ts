import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";

const VALID_TYPES = ["REMOTE", "ONSITE", "HYBRID"];

/**
 * GET /api/internships?q=&type=
 * Public-ish list: shows OPEN, non-hidden internships to everyone.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const typeParam = request.nextUrl.searchParams.get("type");
    const type = typeParam && VALID_TYPES.includes(typeParam) ? typeParam : undefined;

    const internships = await prisma.internship.findMany({
      where: {
        hidden: false,
        status: {
          in: ["OPEN", "CLOSED", "FILLED"],
        },
        ...(type ? { type: type as "REMOTE" | "ONSITE" | "HYBRID" } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { company: { contains: q } },
                { location: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        postedBy: { select: { id: true, name: true, image: true } },
        _count: { select: { applications: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 60,
    });

    return NextResponse.json({ internships });
  } catch (error) {
    console.error("Error listing internships:", error);
    return NextResponse.json(
      { error: "Failed to fetch internships" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/internships
 * Create an internship listing. Any signed-in user may post; admins can
 * moderate afterwards.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    const title = String(body?.title ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const type =
      body?.type && VALID_TYPES.includes(body.type as string)
        ? (body.type as "REMOTE" | "ONSITE" | "HYBRID")
        : "ONSITE";
    const location = String(body?.location ?? "").trim();
    const duration = String(body?.duration ?? "").trim();
    const stipend = String(body?.stipend ?? "").trim();
    const deadlineRaw = body?.applicationDeadline;

    if (!title || !company || !description) {
      return NextResponse.json(
        { error: "Title, company and description are required" },
        { status: 400 },
      );
    }
    if (title.length > 200 || company.length > 200) {
      return NextResponse.json(
        { error: "Title and company must be 200 characters or fewer" },
        { status: 400 },
      );
    }
    if (description.length > 10000) {
      return NextResponse.json(
        { error: "Description is too long" },
        { status: 400 },
      );
    }

    let applicationDeadline: Date | null = null;
    if (deadlineRaw) {
      const parsed = new Date(deadlineRaw as string);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Invalid application deadline" },
          { status: 400 },
        );
      }
      applicationDeadline = parsed;
    }

    const internship = await prisma.internship.create({
      data: {
        title,
        company,
        description,
        type,
        location: location.slice(0, 200),
        duration: duration.slice(0, 120),
        stipend: stipend.slice(0, 120),
        applicationDeadline,
        postedById: session.user.id,
      },
    });

    return NextResponse.json({ internship }, { status: 201 });
  } catch (error) {
    console.error("Error creating internship:", error);
    return NextResponse.json(
      { error: "Failed to create internship" },
      { status: 500 },
    );
  }
}