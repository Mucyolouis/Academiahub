import type {
  MentorBrowseResponse,
  MentorshipOverview,
  MentorshipRequestListItem,
  OwnMentorProfile,
} from "@/app/_types/mentorships";

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

// ─── Browsing & requests ───────────────────────────────────────────────

export async function fetchMentors(query = ""): Promise<MentorBrowseResponse["mentors"]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  const data = await jsonFetch<MentorBrowseResponse>(
    `/api/mentors/browse${params.toString() ? `?${params}` : ""}`,
  );
  return data.mentors;
}

export async function fetchMentorshipOverview(): Promise<MentorshipOverview> {
  return jsonFetch<MentorshipOverview>("/api/mentorships");
}

export async function sendMentorshipRequest(input: {
  mentorId: string;
  topic: string;
  message: string;
}): Promise<{ request: MentorshipRequestListItem }> {
  return jsonFetch("/api/mentorships", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function respondToMentorshipRequest(
  requestId: string,
  action: "accept" | "decline",
): Promise<void> {
  await jsonFetch(`/api/mentorships/requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export async function updateMentorship(
  mentorshipId: string,
  action: "end" | "complete",
): Promise<void> {
  await jsonFetch(`/api/mentorships/${mentorshipId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

// ─── Own mentor profile ─────────────────────────────────────────────────

export async function fetchOwnMentorProfile(): Promise<OwnMentorProfile | null> {
  const data = await jsonFetch<{ profile: OwnMentorProfile | null }>("/api/mentor-profile");
  return data.profile;
}

export async function saveMentorProfile(input: {
  title: string;
  bio: string;
  areas: string[];
  yearsExperience: number;
  availability: string;
}): Promise<OwnMentorProfile> {
  const data = await jsonFetch<{ profile: OwnMentorProfile }>("/api/mentor-profile", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.profile;
}

export async function deleteMentorProfile(): Promise<void> {
  await jsonFetch("/api/mentor-profile", { method: "DELETE" });
}