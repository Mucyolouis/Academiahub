import Link from "next/link";
import prisma from "@/prisma/connection";
import ReportActions from "../_components/ReportActions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["PENDING", "REVIEWED", "DISMISSED"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

function parseStatus(value?: string): StatusFilter {
  return (STATUS_TABS as readonly string[]).includes(value ?? "")
    ? (value as StatusFilter)
    : "PENDING";
}

const reasonStyles: Record<string, string> = {
  PLAGIARISM: "bg-red-50 text-red-600",
  MISLEADING: "bg-orange-50 text-orange-600",
  COPYRIGHT: "bg-purple-50 text-purple-600",
  INAPPROPRIATE: "bg-pink-50 text-pink-600",
  SPAM: "bg-yellow-50 text-yellow-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const status = parseStatus((await searchParams).status);

  const reports = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reason: true,
      description: true,
      status: true,
      resolution: true,
      resolvedAt: true,
      createdAt: true,
      reporter: { select: { name: true, email: true } },
      resolver: { select: { name: true, email: true } },
      document: {
        select: {
          id: true,
          title: true,
          fileUrl: true,
          status: true,
          author: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review flagged documents and take action
        </p>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab}
            asChild
            size="sm"
            variant={tab === status ? "default" : "outline"}
          >
            <Link href={`/admin/reports?status=${tab}`}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Link>
          </Button>
        ))}
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No {status.toLowerCase()} reports.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    reasonStyles[report.reason] ?? reasonStyles.OTHER
                  }`}
                >
                  {report.reason}
                </span>
                <Link
                  href={`/publication/${report.document.id}`}
                  className="font-semibold hover:underline"
                >
                  {report.document.title}
                </Link>
                <span className="text-xs text-gray-400 ml-auto">
                  {report.createdAt.toLocaleDateString()}{" "}
                  {report.createdAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {report.description ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  “{report.description}”
                </p>
              ) : null}

              <p className="text-xs text-gray-500">
                Reported by {report.reporter.name ?? report.reporter.email}
                {report.document.author?.name
                  ? ` · Author: ${report.document.author.name}`
                  : ""}
                {report.document.status === "HIDDEN" ? " · Hidden" : ""}
              </p>

              {report.resolution !== "NONE" ? (
                <p className="text-xs text-gray-500">
                  Resolved with “{report.resolution}”
                  {report.resolver?.name ? ` by ${report.resolver.name}` : ""}
                  {report.resolvedAt
                    ? ` · ${report.resolvedAt.toLocaleString()}`
                    : ""}
                </p>
              ) : null}

              <ReportActions
                reportId={report.id}
                status={report.status}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
