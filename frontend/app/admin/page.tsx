import Link from "next/link";
import { FileText, Flag, Users, Download, EyeOff } from "lucide-react";
import prisma from "@/prisma/connection";

export const dynamic = "force-dynamic";

const CARDS = [
  { key: "users", label: "Users", icon: Users, href: "/admin/users" },
  { key: "suspendedUsers", label: "Suspended users", icon: EyeOff, href: "/admin/users" },
  { key: "documents", label: "Documents", icon: FileText, href: "/admin/documents" },
  { key: "hiddenDocs", label: "Hidden documents", icon: EyeOff, href: "/admin/documents?status=HIDDEN" },
  { key: "pendingReports", label: "Pending reports", icon: Flag, href: "/admin/reports" },
  { key: "downloads", label: "Total downloads", icon: Download, href: null },
  { key: "hiddenComments", label: "Hidden comments", icon: EyeOff, href: null },
] as const;

export default async function AdminOverviewPage() {
  const [users, documents, pendingReports, downloadAgg, recentReports, suspendedUsers, hiddenDocs, hiddenComments, recentActions] =
    await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.document.aggregate({ _sum: { downloads: true } }),
      prisma.report.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          reason: true,
          createdAt: true,
          reporter: { select: { name: true, email: true } },
          document: { select: { id: true, title: true } },
        },
      }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.document.count({ where: { status: "HIDDEN" } }),
      prisma.comment.count({ where: { isHidden: true } }),
      prisma.adminAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          actor: { select: { name: true, email: true } },
        },
      }),
    ]);

  const values: Record<string, number> = {
    users,
    suspendedUsers,
    documents,
    hiddenDocs,
    pendingReports,
    downloads: downloadAgg._sum.downloads ?? 0,
    hiddenComments,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform activity at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map(({ key, label, icon: Icon, href }) => {
          const content = (
            <div className="rounded-xl border bg-white p-5 shadow-sm h-full">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{label}</span>
                <Icon size={18} strokeWidth={1.75} className="text-gray-400" />
              </div>
              <p className="text-3xl font-bold mt-2">{values[key]}</p>
            </div>
          );
          return href ? (
            <Link key={key} href={href}>
              {content}
            </Link>
          ) : (
            <div key={key}>{content}</div>
          );
        })}
      </div>

      <section>
        <h2 className="font-semibold mb-3">Latest pending reports</h2>
        {recentReports.length === 0 ? (
          <p className="text-sm text-gray-500">No pending reports.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white shadow-sm">
            {recentReports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                  {report.reason}
                </span>
                <Link
                  href={`/publication/${report.document.id}`}
                  className="font-medium hover:underline"
                >
                  {report.document.title}
                </Link>
                <span className="text-gray-400 ml-auto text-xs">
                  by {report.reporter.name ?? report.reporter.email}
                </span>
                <Link
                  href="/admin/reports"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent activity</h2>
          <Link href="/admin/audit" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {recentActions.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white shadow-sm">
            {recentActions.map((action) => (
              <li
                key={action.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span className="font-medium">{action.action}</span>
                <span className="text-gray-500">
                  {action.targetType}:{action.targetId.slice(0, 8)}
                </span>
                <span className="text-gray-400 ml-auto text-xs">
                  {action.actor?.name ?? action.actor?.email ?? "unknown"} ·{" "}
                  {action.createdAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
