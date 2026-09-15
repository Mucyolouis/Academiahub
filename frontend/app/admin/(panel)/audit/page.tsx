import Link from "next/link";
import prisma from "@/prisma/connection";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const TARGET_LINKS: Record<string, (id: string) => string> = {
  user: (id) => `/admin/users/${id}`,
  report: () => `/admin/reports?status=PENDING`,
};

export default async function AdminAuditLog({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; targetType?: string }>;
}) {
  const { page: pageParam, targetType } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);

  const where = targetType
    ? { targetType }
    : {};

  const [actions, total] = await Promise.all([
    prisma.adminAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        details: true,
        createdAt: true,
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.adminAction.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record of administrator actions across the platform.
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-gray-500">No audit records yet.</p>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">At</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {actions.map((action) => {
                const linkFn = TARGET_LINKS[action.targetType];
                const link = linkFn ? linkFn(action.targetId) : null;
                return (
                  <tr key={action.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {action.action}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {action.actor?.name ?? action.actor?.email ?? "unknown"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {link ? (
                        <Link href={link} className="hover:underline font-mono text-xs">
                          {action.targetType}:{action.targetId.slice(0, 8)}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">
                          {action.targetType}:{action.targetId.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-72 truncate">
                      {action.details ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {action.createdAt.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        {page > 1 ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/admin/audit?page=${page - 1}${targetType ? `&targetType=${encodeURIComponent(targetType)}` : ""}`}
            >
              Previous
            </Link>
          </Button>
        ) : null}
        <span className="text-gray-500 px-2">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/admin/audit?page=${page + 1}${targetType ? `&targetType=${encodeURIComponent(targetType)}` : ""}`}
            >
              Next
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}