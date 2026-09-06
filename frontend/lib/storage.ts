import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type UploadKind = "avatar" | "document";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

interface UploadPolicy {
  subfolder: "avatars" | "documents";
  maxBytes: number;
  allowedMime: string[];
  extensionsByMime: Record<string, string>;
}

const POLICIES: Record<UploadKind, UploadPolicy> = {
  avatar: {
    subfolder: "avatars",
    maxBytes: 4 * 1024 * 1024,
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
    extensionsByMime: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
  },
  document: {
    subfolder: "documents",
    maxBytes: 10 * 1024 * 1024,
    allowedMime: ["application/pdf"],
    extensionsByMime: { "application/pdf": "pdf" },
  },
};

export interface StoredUpload {
  url: string;
  key: string;
  fileName: string;
  bytes: number;
}

function sanitizeExtension(fileName: string, fallback: string): string {
  const ext = path.extname(fileName).replace(".", "").toLowerCase();
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : fallback;
}

export async function saveUpload(
  kind: UploadKind,
  file: File,
  userId: string,
): Promise<StoredUpload> {
  const policy = POLICIES[kind];
  const extension =
    policy.extensionsByMime[file.type] ?? sanitizeExtension(file.name, "");

  if (!policy.allowedMime.includes(file.type) || !extension) {
    throw new Error("Unsupported file type");
  }
  if (file.size > policy.maxBytes) {
    throw new Error("File exceeds the maximum allowed size");
  }

  const dir = path.join(UPLOADS_DIR, policy.subfolder);
  await mkdir(dir, { recursive: true });

  const storedName =
    kind === "avatar"
      ? `${userId}.${extension}`
      : `${randomUUID()}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  const url =
    kind === "avatar"
      ? `/api/files/avatars/${storedName}?v=${Date.now()}`
      : `/api/files/documents/${storedName}`;

  return {
    url,
    key: `${policy.subfolder}/${storedName}`,
    fileName: file.name,
    bytes: file.size,
  };
}
