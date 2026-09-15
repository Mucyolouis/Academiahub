"use client";

import Link from "next/link";
import { Briefcase, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EmptySection from "@/components/user/shared/EmptySection";
import { useMyApplications } from "@/lib/internships/hooks";
import { formatTimeAgo } from "@/lib/notifications/formatTime";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Under review", className: "bg-gray-100 text-gray-600" },
  SHORTLISTED: { label: "Shortlisted", className: "bg-blue-50 text-blue-700" },
  ACCEPTED: { label: "Accepted", className: "bg-green-50 text-green-700" },
  REJECTED: { label: "Not selected", className: "bg-red-50 text-red-600" },
};

export default function MyApplicationsPage() {
  const { data, isLoading } = useMyApplications();

  return (
    <main className="lg:px-6 m-2 lg:m-6 rounded lg:rounded-2xl bg-white lg:py-4 lg:mb-0 py-2">
      <header className="w-full md:bg-white py-2 md:py-7 px-2 md:px-4 mb-2 rounded-lg">
        <h1 className="font-medium max-sm:text-primary text-2xl flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          My applications
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Track the internships you&apos;ve applied to and their status.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : data && data.length === 0 ? (
        <EmptySection
          title="No applications yet"
          text="Browse internships and apply — your applications will show up here."
        />
      ) : (
        <ul className="divide-y divide-gray-50 px-2 md:px-4">
          {data?.map((application) => {
            const meta =
              STATUS_STYLES[application.status] ?? STATUS_STYLES.PENDING;
            return (
              <li key={application.id} className="flex flex-col gap-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/internships/${application.internship.id}`}
                      className="font-medium hover:underline"
                    >
                      {application.internship.title}
                    </Link>
                    <p className="text-sm text-gray-500 truncate">
                      {application.internship.company} ·{" "}
                      {application.internship.location || "No location"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">
                  {application.coverLetter}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Applied {formatTimeAgo(application.createdAt)}</span>
                  {application.internship.status === "FILLED" &&
                  application.status === "ACCEPTED" ? (
                    <span className="text-green-600 font-medium">
                      You got the position!
                    </span>
                  ) : null}
                  <Badge variant="outline" className="ml-auto shrink-0" asChild>
                    <Link href={`/internships/${application.internship.id}`}>
                      View listing
                    </Link>
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}