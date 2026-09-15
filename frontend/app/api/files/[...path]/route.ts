import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { UPLOADS_DIR } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const relative = segments.map((segment) => decodeURIComponent(segment)).join("/");
  const absolute = path.resolve(UPLOADS_DIR, relative);

  if (
    absolute !== UPLOADS_DIR &&
    !absolute.startsWith(UPLOADS_DIR + path.sep)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = await readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=3600",
    };

    if (request.nextUrl.searchParams.get("download") === "1") {
      const rawName =
        request.nextUrl.searchParams.get("name") ?? path.basename(absolute);
      const safeName = rawName.replace(/[^A-Za-z0-9._ -]/g, "").trim() || "file";
      headers["Content-Disposition"] =
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
    }

    return new NextResponse(new Uint8Array(data), { headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
