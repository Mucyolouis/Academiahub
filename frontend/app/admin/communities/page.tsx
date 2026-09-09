import { requireAdmin } from "@/lib/admin-guard";
import prisma from "@/prisma/connection";
import AdminDeleteButton from "../_components/AdminDeleteButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminCommunities({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();

  const { q } = await searchParams;
  const term = (q ?? "").trim();

  const where = term
    ? { name: { contains: term } }
    : {};

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        description: true,
        owner: { select: { name: true, email: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.community.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Communities</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total</p>
      </div>

      {communities.length === 0 ? (
        <p className="text-sm text-gray-500">No communities found.</p>
      ) : (
        <ul className="space-y-3">
          {communities.map((community) => (
            <li key={community.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{community.name}</p>
                  <p className="text-xs text-gray-400">
                    /{community.slug} · {community._count.members} members · owned by{" "}
                    {community.owner?.name ?? community.owner?.email ?? "unknown"}
                  </p>
                  {community.description ? (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {community.description}
                    </p>
                  ) : null}
                </div>
                <div className="ml-auto flex gap-2">
                  <AdminDeleteButton
                    url={`/api/admin/communities/${community.id}`}
                    label="Delete"
                    confirmMessage={`Permanently delete the community "${community.name}" and all its memberships and document links?`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE ? (
        <p className="text-xs text-gray-400">
          Showing first {PAGE_SIZE} of {total} communities.
        </p>
      ) : null}
    </div>
  );
}