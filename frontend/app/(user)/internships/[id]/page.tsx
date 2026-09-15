"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  Building2,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Send,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import EmptySection from "@/components/user/shared/EmptySection";
import ApplyDialog from "@/components/internships/ApplyDialog";
import ApplicationRow from "@/components/internships/ApplicationRow";
import {
  useInternshipApplications,
  useInternshipDetail,
} from "@/lib/internships/hooks";
import { formatTimeAgo } from "@/lib/notifications/formatTime";
import { getInitials } from "@/lib/messaging/utils";

const TYPE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  ONSITE: "On-site",
  HYBRID: "Hybrid",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
  FILLED: "bg-amber-50 text-amber-700",
};

const MY_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  SHORTLISTED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};

export default function InternshipDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const id = params.id;
  const { data: internship, isLoading } = useInternshipDetail(id);
  const applications = useInternshipApplications(
    internship?.isOwner || session?.user?.role === "ADMIN" ? id : null,
  );
  const [showApply, setShowApply] = useState(false);
  const [now] = useState(() => Date.now());

  if (isLoading || !internship) {
    return (
      <main className="m-2 lg:m-6 rounded lg:rounded-2xl bg-white p-6">
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </main>
    );
  }

  const canViewApplications =
    internship.isOwner || session?.user?.role === "ADMIN";
  const deadline = internship.applicationDeadline
    ? new Date(internship.applicationDeadline)
    : null;
  const deadlinePassed = deadline ? deadline.getTime() < now : false;
  const canApply =
    internship.status === "OPEN" &&
    !internship.myApplication &&
    !canViewApplications;

  return (
    <main className="m-2 lg:m-6 lg:px-6 lg:mb-0">
      <div className="rounded lg:rounded-2xl bg-white lg:py-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[internship.status] ?? ""}`}
              >
                {internship.status}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {TYPE_LABELS[internship.type] ?? internship.type}
              </span>
              {internship.hidden ? (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                  Hidden from public
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {internship.title}
            </h1>
            <p className="flex items-center gap-1 text-gray-600 mt-1">
              <Building2 className="h-4 w-4" />
              {internship.company}
              <span className="text-gray-400">·</span>
              <span className="text-gray-400">
                Posted {formatTimeAgo(internship.createdAt)} by{" "}
                {internship.postedBy.name ?? "Unknown"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {internship.myApplication ? (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${MY_STATUS_STYLES[internship.myApplication] ?? ""}`}
              >
                Applied · {internship.myApplication}
              </span>
            ) : canApply ? (
              <Button onClick={() => setShowApply(true)}>
                <Send className="h-4 w-4" />
                Apply now
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs mb-5">
          {internship.location ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
              <MapPin className="h-3 w-3" />
              {internship.location}
            </span>
          ) : null}
          {internship.duration ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
              <Clock className="h-3 w-3" />
              {internship.duration}
            </span>
          ) : null}
          {internship.stipend ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
              <Wallet className="h-3 w-3" />
              {internship.stipend}
            </span>
          ) : null}
          {deadline ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                deadlinePassed ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"
              }`}
            >
              <CalendarDays className="h-3 w-3" />
              {deadlinePassed
                ? "Deadline passed"
                : `Closes ${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
            </span>
          ) : null}
        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-gray-700 leading-6">
          {internship.description}
        </div>

        {canViewApplications && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Applications
              </h2>
              <span className="text-sm text-gray-400">
                ({internship._count.applications})
              </span>
            </div>

            {applications.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : applications.data && applications.data.length === 0 ? (
              <EmptySection
                title="No applications yet"
                text="Applications will appear here once candidates apply."
              />
            ) : (
              <ul className="divide-y divide-gray-50 rounded-xl border overflow-hidden">
                {applications.data?.map((application) => (
                  <ApplicationRow
                    key={application.id}
                    internshipId={id}
                    application={application}
                    onStatusChange={() => {
                      toast.success("Application updated");
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="mt-6 flex items-center gap-2">
          <Avatar className="h-8 w-8 border">
            <AvatarImage
              src={internship.postedBy.image || undefined}
              alt={internship.postedBy.name || "poster"}
            />
            <AvatarFallback>
              {getInitials(internship.postedBy.name || "")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-500">
            Posted by{" "}
            <Link
              href={`/profile/${internship.postedBy.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {internship.postedBy.name ?? "Unknown"}
            </Link>
          </span>
        </div>
      </div>

      {showApply ? (
        <ApplyDialog
          internshipId={internship.id}
          onClose={() => setShowApply(false)}
        />
      ) : null}
    </main>
  );
}