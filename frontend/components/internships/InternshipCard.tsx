"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Clock, MapPin, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InternshipListItem } from "@/app/_types/internships";
import { formatTimeAgo } from "@/lib/notifications/formatTime";

const TYPE_META: Record<string, { label: string; className: string }> = {
  REMOTE: { label: "Remote", className: "bg-blue-50 text-blue-700" },
  ONSITE: { label: "On-site", className: "bg-gray-100 text-gray-600" },
  HYBRID: { label: "Hybrid", className: "bg-purple-50 text-purple-700" },
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-green-50 text-green-700" },
  CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-500" },
  FILLED: { label: "Filled", className: "bg-amber-50 text-amber-700" },
};

export default function InternshipCard({ internship }: { internship: InternshipListItem }) {
  const [now] = useState(() => Date.now());
  const type = TYPE_META[internship.type] ?? TYPE_META.ONSITE;
  const status = STATUS_META[internship.status] ?? STATUS_META.OPEN;
  const isOpen = internship.status === "OPEN";
  const deadline = internship.applicationDeadline
    ? new Date(internship.applicationDeadline)
    : null;

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/internships/${internship.id}`}>
            <h3 className="font-semibold leading-5 truncate hover:underline">
              {internship.title}
            </h3>
          </Link>
          <p className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
            <Building2 className="h-3.5 w-3.5" />
            {internship.company}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${type.className}`}
        >
          <span className="capitalize">{type.label}</span>
        </span>
        {internship.location ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600">
            <MapPin className="h-3 w-3" />
            {internship.location}
          </span>
        ) : null}
        {internship.duration ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600">
            <Clock className="h-3 w-3" />
            {internship.duration}
          </span>
        ) : null}
        {internship.stipend ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600">
            <Wallet className="h-3 w-3" />
            {internship.stipend}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-gray-500 line-clamp-2">{internship.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-1">
        <span>
          Posted {formatTimeAgo(internship.createdAt)} ·{" "}
          {internship._count.applications}{" "}
          {internship._count.applications === 1 ? "application" : "applications"}
        </span>
        {deadline ? (
          <span className={isOpen && deadline.getTime() < now ? "text-red-500" : ""}>
            {deadline.getTime() > now
              ? `Closes ${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "Deadline passed"}
          </span>
        ) : null}
      </div>

      <Badge className="w-fit" variant={isOpen ? "default" : "outline"}>
        <Link href={`/internships/${internship.id}`}>
          {isOpen ? "View & apply" : "View details"}
        </Link>
      </Badge>
    </li>
  );
}