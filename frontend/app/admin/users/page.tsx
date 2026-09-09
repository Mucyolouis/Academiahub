import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import UserRoleControls from "../_components/UserRoleControls";
import UserModerationControls from "../_components/UserModerationControls";
import AdminDeleteButton from "../_components/AdminDeleteButton";
import UserFormDialog from "../_components/UserFormDialog";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const [session, { q, page: pageParam }] = await Promise.all([
    getServerSession(authOptions),
    searchParams,
  ]);
  const term = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);

  const where = term
    ? {
        OR: [
          { name: { contains: term } },
          { email: { contains: term } },
          { Profile: { some: { institution: { contains: term } } } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { role: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isSuspended: true,
        emailVerified: true,
        _count: { select: { Document: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-gray-500 mt-1">{total} registered</p>
        </div>
        <div className="flex gap-2">
          <form action="/admin/users" className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={term}
              placeholder="Search name or email…"
              className="h-9 w-64 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button size="sm" type="submit">
              Search
            </Button>
          </form>
          <UserFormDialog />
        </div>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-gray-500">No users found.</p>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Documents</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const isSelf = user.id === session?.user?.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium hover:underline"
                      >
                        {user.name ?? "Unnamed"}
                      </Link>
                      {isSelf ? (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      ) : null}
                      {user.isSuspended ? (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium">
                          suspended
                        </span>
                      ) : null}
                      <span className="block text-xs text-gray-400">
                        {user.email}
                        {!user.emailVerified ? " · unverified" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <Link
                        href={`/admin/documents?q=${encodeURIComponent(user.name ?? "")}`}
                        className="hover:underline"
                      >
                        {user._count.Document}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <UserFormDialog
                          user={{
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                          }}
                        />
                        <UserRoleControls
                          userId={user.id}
                          role={user.role}
                          isSelf={isSelf}
                        />
                        <UserModerationControls
                          userId={user.id}
                          isSuspended={user.isSuspended}
                          emailVerified={!!user.emailVerified}
                          isSelf={isSelf}
                        />
                        {!isSelf ? (
                          <AdminDeleteButton
                            url={`/api/admin/users/${user.id}`}
                            label="Delete"
                            confirmMessage={`Permanently delete ${user.name ?? user.email} and all their documents, comments and messages?`}
                          />
                        ) : null}
                      </div>
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
              href={`/admin/users?page=${page - 1}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
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
              href={`/admin/users?page=${page + 1}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            >
              Next
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
