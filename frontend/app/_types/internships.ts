// ─── Internship Types ───────────────────────────────────────────────────

export type InternshipStatus = "OPEN" | "CLOSED" | "FILLED";
export type InternshipType = "REMOTE" | "ONSITE" | "HYBRID";
export type ApplicationStatus = "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";

export interface InternshipListItem {
  id: string;
  title: string;
  company: string;
  description: string;
  type: InternshipType;
  location: string;
  duration: string;
  stipend: string;
  applicationDeadline: string | null;
  status: InternshipStatus;
  hidden: boolean;
  createdAt: string;
  postedBy: { id: string; name: string | null; image: string | null };
  _count: { applications: number };
}

export interface InternshipApplicationListItem {
  id: string;
  coverLetter: string;
  resumeUrl: string | null;
  resumeName: string | null;
  status: ApplicationStatus;
  createdAt: string;
  applicant: { id: string; name: string | null; image: string | null; email: string };
}

export interface InternshipDetail extends InternshipListItem {
  myApplication: ApplicationStatus | null;
  isOwner: boolean;
}

export interface MyInternshipApplication {
  id: string;
  coverLetter: string;
  resumeUrl: string | null;
  resumeName: string | null;
  status: ApplicationStatus;
  createdAt: string;
  internship: InternshipListItem;
}