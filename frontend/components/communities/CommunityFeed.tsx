"use client";
import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResearchCard from "@/components/user/dashboard/ResearchCard";
import { fetchCommunityDocuments } from "@/lib/communities/api";
import type { CommunityDocument } from "@/lib/communities/api";

type CommunityFeedProps = {
  slug: string;
  initialDocuments: CommunityDocument[];
  initialHasMore: boolean;
  isMember: boolean;
};

const CommunityFeed = ({
  slug,
  initialDocuments,
  initialHasMore,
  isMember,
}: CommunityFeedProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [documents, setDocuments] = useState(initialDocuments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const data = await fetchCommunityDocuments(slug, { page: nextPage });
        setDocuments((prev) => [...prev, ...data.documents]);
        setPage(nextPage);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } catch (error) {
        console.error("Failed to load more documents:", error);
      }
    });
  };

  const goToUpload = () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    router.push("/uploads");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold leading-[130%]">
          Publications
        </h2>
        {isMember && (
          <Button asChild size="sm" className="gap-1.5">
            <a href="/uploads">
              <Plus size={16} strokeWidth={2} />
              Publish
            </a>
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border border-[#D9D9D9] rounded-2xl py-16 px-6 text-center">
          {isMember ? (
            <>
              <p className="text-grey">
                No publications in this community yet.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={goToUpload}
              >
                Publish the first one
              </Button>
            </>
          ) : (
            <>
              <Users size={32} strokeWidth={1.5} className="mx-auto text-grey mb-3" />
              <p className="text-grey">
                No publications posted yet. Join this community to share your
                research.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {documents.map((data, index) => (
              <ResearchCard
                key={data.id}
                data={data}
                isOwnDocument={data.authorId === session?.user?.id}
                isLiked={!!data.isLiked}
                isSaved={!!data.isSaved}
                showSaveButton={data.author.id !== session?.user?.id}
                priority={index === 0}
              />
            ))}
          </section>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                className="px-8"
                onClick={loadMore}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CommunityFeed;