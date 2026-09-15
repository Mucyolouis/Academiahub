import { requireAdmin } from "@/lib/admin-guard";
import prisma from "@/prisma/connection";
import ReviewModerationButton from "../_components/ReviewModerationButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminModerationReviews() {
  await requireAdmin();

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        rating: true,
        isHidden: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        document: { select: { id: true, title: true } },
      },
    }),
    prisma.review.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} total · {reviews.filter((r) => r.isHidden).length} hidden on this page
        </p>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">
                  {review.user?.name ?? review.user?.email ?? "unknown"}
                </span>
                <span className="text-amber-500 text-xs">
                  {"★".repeat(review.rating)}
                  <span className="text-gray-300">{"★".repeat(5 - review.rating)}</span>
                </span>
                <span className="text-gray-400 text-xs">on</span>
                <span className="text-gray-600">{review.document.title}</span>
                {review.isHidden ? (
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs">
                    hidden
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-gray-400">
                  {review.createdAt.toLocaleString()}
                </span>
              </div>
              <ReviewModerationButton
                reviewId={review.id}
                isHidden={review.isHidden}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}