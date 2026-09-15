import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import UserRoleControls from "../../_components/UserRoleControls";
import UserModerationControls from "../../_components/UserModerationControls";
import AdminDeleteButton from "../../_components/AdminDeleteButton";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "user.promote": "Promoted to admin",
  "user.demote": "Demoted to user",
  "user.suspend": "Suspended",
  "user.unsuspend": "Suspension lifted",
  "user.verify": "Email verified",
  "user.unverify": "Email unverified",
  "user.delete": "Deleted",
};

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id: userId } = await params;

  const [user, documents, likesReceived, savesReceived, adminActions] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isSuspended: true,
          suspendedAt: true,
          suspendedReason: true,
          emailVerified: true,
          _count: { select: { Document: true, reviews: true } },
          Profile: { select: { institution: true, department: true, country: true } },
        },
      }),
      prisma.document.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          downloads: true,
          likes: true,
          createdAt: true,
        },
      }),
      prisma.document.aggregate({
        where: { authorId: userId },
        _sum: { likes: true },
      }),
      prisma.save.count({ where: { document: { authorId: userId } } }),
      prisma.adminAction.findMany({
        where: { targetType: "user", targetId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          actor: { select: { name: true, email: true } },
        },
      }),
    ]);

  if (!user) notFound();

  const isSelf = user.id === session?.user?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name ?? "Unnamed"}
            </h1>
            {isSelf ? (
              <span className="text-xs text-gray-400">(you)</span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            {user.emailVerified ? "Email verified" : "Email unverified"} ·{" "}
            {user.isSuspended ? "Suspended" : "Active"}
          </p>
          {user.isSuspended && user.suspendedReason ? (
            <p className="text-sm text-red-600 mt-1">
              Suspension reason: {user.suspendedReason}
            </p>
          ) : null}
          {user.Profile[0] ? (
            <p className="text-xs text-gray-500 mt-1">
              {[user.Profile[0].institution, user.Profile[0].department, user.Profile[0].country]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <UserRoleControls userId={user.id} role={user.role} isSelf={isSelf} />
          <UserModerationControls
            userId={user.id}
            isSuspended={user.isSuspended}
            emailVerified={!!user.emailVerified}
            isSelf={isSelf}
          />
          {!isSelf ? (
            <AdminDeleteButton
              url={`/api/admin/users/${user.id}`}
              label="Delete user"
              confirmMessage={`Permanently delete ${user.name ?? user.email} and all their documents, comments and messages?`}
            />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{user._count.Document}</p>
          <p className="text-xs text-gray-500">Documents</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{likesReceived._sum.likes ?? 0}</p>
          <p className="text-xs text-gray-500">Likes received</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{savesReceived}</p>
          <p className="text-xs text-gray-500">Saves received</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{user._count.reviews}</p>
          <p className="text-xs text-gray-500">Reviews received</p>
        </div>
      </div>

      {documents.length > 0 ? (
        <div>
          <h2 className="font-semibold mb-2">Documents</h2>
          <ul className="rounded-xl border bg-white divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <Link
                  href={`/admin/documents?q=${encodeURIComponent(doc.title)}`}
                  className="font-medium hover:underline truncate"
                >
                  {doc.title}
                </Link>
                {doc.status === "HIDDEN" ? (
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs">
                    hidden
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-gray-400">
                  {doc.downloads} downloads · {doc.likes} likes ·{" "}
                  {doc.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {adminActions.length > 0 ? (
        <div>
          <h2 className="font-semibold mb-2">Recent moderation history</h2>
          <ul className="rounded-xl border bg-white divide-y">
            {adminActions.map((action) => (
              <li key={action.id} className="px-4 py-3 text-sm">
                <span className="font-medium">
                  {ACTION_LABELS[action.action] ?? action.action}
                </span>
                <span className="text-gray-400">
                  {" "}
                  · by {action.actor?.name ?? action.actor?.email ?? "unknown"} ·{" "}
                  {action.createdAt.toLocaleString()}
                </span>
                {action.details ? (
                  <p className="text-xs text-gray-500 mt-1">{action.details}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button asChild size="sm" variant="outline">
        <Link href="/admin/users">Back to users</Link>
      </Button>
    </div>
  );
}