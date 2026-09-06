import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { saveUpload, type UploadKind } from "@/lib/storage";

function isUploadKind(value: unknown): value is UploadKind {
  return value === "avatar" || value === "document";
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const kind = form.get("kind");
  const file = form.get("file");

  if (!isUploadKind(kind)) {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const stored = await saveUpload(kind, file, session.user.id);
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to store file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
