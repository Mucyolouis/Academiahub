import type { $Enums } from "@prisma/client";

export type CommunitySummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  owner: { id: string; name: string | null; image: string | null };
  _count: { members: number; documents: number };
  isMember?: boolean;
  createdAt: string;
};

export type CommunityDetail = CommunitySummary & {
  ownerId: string;
  updatedAt: string;
  isMember: boolean;
  members: Array<{
    user: { id: string; name: string | null; image: string | null };
  }>;
};

export type CommunityDocument = {
  id: string;
  title: string;
  description: string;
  category: $Enums.Category;
  institution: string;
  year: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  downloads: number;
  likes: number;
  authorId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: { id: string; name: string | null; image: string | null };
  _count: { commentRecords: number };
  isLiked?: boolean;
  isSaved?: boolean;
};

type PageResponse<T> = {
  items?: T[];
  communities?: T[];
  documents?: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchCommunities(
  params: { q?: string; joined?: boolean; page?: number; limit?: number } = {},
): Promise<{ communities: CommunitySummary[]; pagination: PageResponse<CommunitySummary>["pagination"] }> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.joined) searchParams.set("joined", "true");
  searchParams.set("page", String(params.page || 1));
  searchParams.set("limit", String(params.limit || 50));

  const res = await fetch(`/api/communities?${searchParams.toString()}`);
  return parseOrThrow(res);
}

export async function fetchCommunity(slug: string): Promise<CommunityDetail> {
  const res = await fetch(`/api/communities/${slug}`);
  const data = await parseOrThrow<{ community: CommunityDetail }>(res);
  return data.community;
}

export async function createCommunity(input: {
  name: string;
  description: string;
  image?: string;
}): Promise<{ slug: string }> {
  const res = await fetch("/api/communities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(res);
}

export async function joinCommunity(slug: string): Promise<void> {
  const res = await fetch(`/api/communities/${slug}/members`, { method: "POST" });
  await parseOrThrow(res);
}

export async function leaveCommunity(slug: string): Promise<void> {
  const res = await fetch(`/api/communities/${slug}/members`, { method: "DELETE" });
  await parseOrThrow(res);
}

export async function fetchCommunityDocuments(
  slug: string,
  params: { sort?: string; page?: number; limit?: number } = {},
): Promise<{ documents: CommunityDocument[]; pagination: PageResponse<CommunityDocument>["pagination"] }> {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set("sort", params.sort);
  searchParams.set("page", String(params.page || 1));
  searchParams.set("limit", String(params.limit || 12));

  const res = await fetch(`/api/communities/${slug}/documents?${searchParams.toString()}`);
  return parseOrThrow(res);
}