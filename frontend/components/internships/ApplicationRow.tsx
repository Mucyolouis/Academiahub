"use client";

import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InternshipApplicationListItem } from "@/app/_types/internships";
import { useUpdateApplicationStatus } from "@/lib/internships/hooks";
import { formatTimeAgo } from "@/lib/notifications/formatTime";
import { getInitials } from "@/lib/messaging/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  SHORTLISTED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};

export default function ApplicationRow({
  internshipId,
  application,
  onStatusChange,
}: {
  internshipId: string;
  application: InternshipApplicationListItem;
  onStatusChange?: () => void;
}) {
  const update = useUpdateApplicationStatus();

  const setStatus = (status: "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED") => {
    update.mutate(
      { internshipId, applicationId: application.id, status },
      {
        onSuccess: () => {
          toast.success(`Application ${status.toLowerCase()}`);
          onStatusChange?.();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage
            src={application.applicant.image || undefined}
            alt={application.applicant.name || "applicant"}
          />
          <AvatarFallback>
            {getInitials(application.applicant.name || "")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {application.applicant.name ?? "Unnamed"}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {application.applicant.email} · {formatTimeAgo(application.createdAt)}
          </p>
          <p className="text-sm text-gray-600 mt-2 line-clamp-4 whitespace-pre-wrap">
            {application.coverLetter}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {application.resumeUrl ? (
              <a
                href={`${application.resumeUrl}?download=1&name=${encodeURIComponent(application.resumeName ?? "resume")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline"
              >
                View resume
              </a>
            ) : null}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[application.status] ?? ""}`}
            >
              {application.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus("SHORTLISTED")}
          disabled={update.isPending || application.status === "SHORTLISTED"}
        >
          Shortlist
        </Button>
        <Button
          size="sm"
          onClick={() => setStatus("ACCEPTED")}
          disabled={update.isPending || application.status === "ACCEPTED"}
          className="bg-green-600 hover:bg-green-700"
        >
          <Loader2
            className={`h-3.5 w-3.5 animate-spin ${update.isPending ? "inline" : "hidden"}`}
          />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus("REJECTED")}
          disabled={update.isPending || application.status === "REJECTED"}
          className="text-red-600 hover:text-red-700 border-red-200"
        >
          Reject
        </Button>
      </div>
    </li>
  );
}