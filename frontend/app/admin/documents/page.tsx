import Link from "next/link";
import prisma from "@/prisma/connection";
import AdminDeleteButton from "../_components/AdminDeleteButton";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const term = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);

  const where = term
    ? {
        OR: [
          { title: { contains: term } },
          { institution: { contains: term } },
          { author: { is: { name: { contains: term } } } },
        ],
      }
    : {};

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        category: true,
        institution: true,
        year: true,
        fileName: true,
        fileSize: true,
        downloads: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    }),
    prisma.document.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total</p>
        </div>
        <form action="/admin/documents" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Search title, author, institution…"
            className="h-9 w-64 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button size="sm" type="submit">
            Search
          </Button>
        </form>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents found.</p>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Downloads</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 max-w-72">
                    <Link
                      href={`/publication/${doc.id}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {doc.title}
                    </Link>
                    <span className="block text-xs text-gray-400">
                      {doc.institution} · {doc.year}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {doc.author?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {doc.category.charAt(0) + doc.category.slice(1).toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatBytes(doc.fileSize)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{doc.downloads}</td>
                  <td className="px-4 py-3 text-right">
                    <AdminDeleteButton
                      url={`/api/admin/documents/${doc.id}`}
                      label="Delete"
                      confirmMessage={`Permanently delete "${doc.title}"? This also removes the stored PDF.`}
                    />
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
              href={`/admin/documents?page=${page - 1}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
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
              href={`/admin/documents?page=${page + 1}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            >
              Next
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
