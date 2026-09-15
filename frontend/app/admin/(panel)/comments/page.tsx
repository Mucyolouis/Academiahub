import { requireAdmin } from "@/lib/admin-guard";
import prisma from "@/prisma/connection";
import CommentModerationButton from "../_components/CommentModerationButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminModerationComments() {
  await requireAdmin();

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        content: true,
        isHidden: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        document: { select: { id: true, title: true } },
      },
    }),
    prisma.comment.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} total · {comments.filter((c) => c.isHidden).length} hidden on this page
        </p>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">
                  {comment.user?.name ?? comment.user?.email ?? "unknown"}
                </span>
                <span className="text-gray-400 text-xs">on</span>
                <span className="text-gray-600">{comment.document.title}</span>
                {comment.isHidden ? (
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs">
                    hidden
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-gray-400">
                  {comment.createdAt.toLocaleString()}
                </span>
              </div>
              <p
                className={`text-sm whitespace-pre-wrap ${
                  comment.isHidden ? "text-gray-400" : "text-gray-700"
                }`}
              >
                {comment.content}
              </p>
              <CommentModerationButton
                commentId={comment.id}
                isHidden={comment.isHidden}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}