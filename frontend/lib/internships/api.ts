import type {
  InternshipApplicationListItem,
  InternshipDetail,
  InternshipListItem,
  MyInternshipApplication,
} from "@/app/_types/internships";

async function jsonFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(body.error ?? `Request failed (${res.status})`) as Error & {
      status: number;
    };
    error.status = res.status;
    throw error;
  }

  return body as T;
}

export interface InternshipInput {
  title: string;
  company: string;
  description: string;
  type: "REMOTE" | "ONSITE" | "HYBRID";
  location: string;
  duration: string;
  stipend: string;
  applicationDeadline: string | null;
}

// ─── Listings ──────────────────────────────────────────────────────────

export async function fetchInternships(params?: {
  q?: string;
  type?: string;
}): Promise<InternshipListItem[]> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.type) search.set("type", params.type);
  const query = search.toString();
  const data = await jsonFetch<{ internships: InternshipListItem[] }>(
    `/api/internships${query ? `?${query}` : ""}`,
  );
  return data.internships;
}

export async function fetchInternshipDetail(id: string): Promise<InternshipDetail> {
  const data = await jsonFetch<{ internship: InternshipDetail }>(`/api/internships/${id}`);
  return data.internship;
}

export async function createInternship(
  input: InternshipInput,
): Promise<InternshipListItem> {
  const data = await jsonFetch<{ internship: InternshipListItem }>("/api/internships", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.internship;
}

// ─── Applications ──────────────────────────────────────────────────────

export async function applyToInternship(input: {
  internshipId: string;
  coverLetter: string;
  resumeUrl?: string | null;
  resumeName?: string | null;
}): Promise<void> {
  await jsonFetch(`/api/internships/${input.internshipId}/applications`, {
    method: "POST",
    body: JSON.stringify({
      coverLetter: input.coverLetter,
      resumeUrl: input.resumeUrl,
      resumeName: input.resumeName,
    }),
  });
}

export async function fetchInternshipApplications(
  internshipId: string,
): Promise<InternshipApplicationListItem[]> {
  const data = await jsonFetch<{ applications: InternshipApplicationListItem[] }>(
    `/api/internships/${internshipId}/applications`,
  );
  return data.applications;
}

export async function updateApplicationStatus(
  internshipId: string,
  applicationId: string,
  status: "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED",
): Promise<void> {
  await jsonFetch(
    `/api/internships/${internshipId}/applications/${applicationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export async function fetchMyApplications(): Promise<MyInternshipApplication[]> {
  const data = await jsonFetch<{ applications: MyInternshipApplication[] }>(
    "/api/internships/my-applications",
  );
  return data.applications;
}