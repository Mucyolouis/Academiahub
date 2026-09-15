import Link from "next/link";
import { Prisma } from "@prisma/client";
import prisma from "@/prisma/connection";
import AdminDeleteButton from "../_components/AdminDeleteButton";
import InternshipVisibilityToggle from "../_components/InternshipVisibilityToggle";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const STATUS_TABS = ["ALL", "OPEN", "CLOSED", "FILLED"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

export default async function AdminInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { q, page: pageParam, status: statusParam } = await searchParams;
  const term = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const status: StatusFilter = (STATUS_TABS as readonly string[]).includes(
    statusParam ?? "",
  )
    ? (statusParam as StatusFilter)
    : "ALL";

  const where: Prisma.InternshipWhereInput = term
    ? {
        OR: [
          { title: { contains: term } },
          { company: { contains: term } },
          { postedBy: { is: { name: { contains: term } } } },
        ],
      }
    : {};

  if (status !== "ALL") {
    where.status = status;
  }

  const [internships, total] = await Promise.all([
    prisma.internship.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        company: true,
        type: true,
        location: true,
        status: true,
        hidden: true,
        createdAt: true,
        postedBy: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.internship.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Internships</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total</p>
        </div>
        <form action="/admin/internships" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Search title, company…"
            className="h-9 w-64 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button size="sm" type="submit">
            Search
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab}
            asChild
            size="sm"
            variant={status === tab ? "default" : "outline"}
          >
            <Link
              href={`/admin/internships?status=${tab}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Link>
          </Button>
        ))}
      </div>

      {internships.length === 0 ? (
        <p className="text-sm text-gray-500">No internships found.</p>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Posted by</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Applications</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {internships.map((internship) => (
                <tr key={internship.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 max-w-72">
                    <Link
                      href={`/internships/${internship.id}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {internship.title}
                    </Link>
                    <span className="block text-xs text-gray-400">
                      {internship.company}
                      {internship.location ? ` · ${internship.location}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {internship.postedBy?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {internship.type.charAt(0) + internship.type.slice(1).toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {internship._count.applications}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                          internship.hidden
                            ? "bg-red-50 text-red-600"
                            : internship.status === "OPEN"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {internship.hidden ? "HIDDEN" : internship.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <InternshipVisibilityToggle
                        internshipId={internship.id}
                        hidden={internship.hidden}
                      />
                      <AdminDeleteButton
                        url={`/api/admin/internships/${internship.id}`}
                        label="Delete"
                        confirmMessage={`Permanently delete "${internship.title}" and all its applications?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        {page > 1 ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/admin/internships?page=${page - 1}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
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
              href={`/admin/internships?page=${page + 1}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            >
              Next
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}