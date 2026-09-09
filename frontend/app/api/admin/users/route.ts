import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { requireAdmin } from "@/lib/admin-guard";
import { recordAdminAction } from "@/lib/admin/audit";
import prisma from "@/prisma/connection";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const name: unknown = body.name;
  const email: unknown = body.email;
  const password: unknown = body.password;
  const role: unknown = body.role;
  const emailVerified: unknown = body.emailVerified;

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { error: "A valid email address is required" },
      { status: 400 },
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }
  if (role !== undefined && role !== "USER" && role !== "ADMIN") {
    return NextResponse.json(
      { error: 'role must be "USER" or "ADMIN"' },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.trim() },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 },
    );
  }

  const hashedPassword = await argon2.hash(password);

  const user = await prisma.user.create({
    data: {
      name: typeof name === "string" && name.trim() ? name.trim() : null,
      email: email.trim(),
      password: hashedPassword,
      role: role ?? "USER",
      emailVerified: emailVerified === true ? new Date() : null,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  await recordAdminAction(session, "user.create", "user", user.id, user.email);

  return NextResponse.json(user, { status: 201 });
}