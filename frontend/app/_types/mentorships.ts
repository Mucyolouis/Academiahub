// ─── Mentorship / Mentor Profile Types ──────────────────────────────────

export type MentorApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DEACTIVATED";

export type MentorshipRequestStatus =
  | "PENDING"
  | "ACTIVE"
  | "COMPLETED"
  | "ENDED"
  | "DECLINED";

export type MentorshipStatusValue =
  | "none"
  | "pending-sent"
  | "pending-incoming"
  | "accepted";

export interface UserRef {
  id: string;
  name: string | null;
  image: string | null;
}

export interface MentorProfileListItem {
  id: string;
  title: string;
  bio: string;
  areas: string[];
  yearsExperience: number;
  availability: string;
  user: UserRef;
  mentorCount: number;
  relationship: MentorshipStatusValue;
}

export interface OwnMentorProfile {
  id: string;
  title: string;
  bio: string;
  areas: string[];
  yearsExperience: number;
  availability: string;
  status: MentorApprovalStatus;
}

export interface MentorshipRequestListItem {
  id: string;
  topic: string;
  message: string;
  status: MentorshipRequestStatus;
  createdAt: string;
  mentor: UserRef;
  requester: UserRef;
}

export interface ActiveMentorship {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "ENDED";
  topic: string;
  startedAt: string;
  endedAt: string | null;
  mentor: UserRef;
  mentee: UserRef;
}

export interface MentorshipOverview {
  incoming: MentorshipRequestListItem[];
  sent: MentorshipRequestListItem[];
  active: ActiveMentorship[];
  asMentor: ActiveMentorship[];
}

export interface MentorBrowseResponse {
  mentors: MentorProfileListItem[];
}