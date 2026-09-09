"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CommunityCard from "./CommunityCard";
import {
  fetchCommunities,
  joinCommunity,
} from "@/lib/communities/api";
import type { CommunitySummary } from "@/lib/communities/api";

const PAGE_SIZE = 12;

const CommunitiesExplore = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const query = useQuery({
    queryKey: ["communities", "browse", debouncedSearch],
    queryFn: () => fetchCommunities({ q: debouncedSearch, limit: PAGE_SIZE }),
  });

  const [isPending, startTransition] = useTransition();
  const [joiningSlug, setJoiningSlug] = useState<string | null>(null);

  const communities = query.data?.communities ?? [];
  const pagination = query.data?.pagination;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const loadMore = () => {
    if (!pagination) return;
    const nextPage = pagination.page + 1;
    startTransition(async () => {
      const data = await fetchCommunities({
        q: debouncedSearch,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      queryClient.setQueryData(
        ["communities", "browse", debouncedSearch],
        (prev?: { communities: CommunitySummary[]; pagination: typeof pagination }) => {
          if (!prev) return data;
          return {
            communities: [...prev.communities, ...data.communities],
            pagination: data.pagination,
          };
        },
      );
    });
  };

  const handleJoin = (slug: string) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setJoiningSlug(slug);
    startTransition(async () => {
      try {
        await joinCommunity(slug);
        queryClient.invalidateQueries({ queryKey: ["communities"] });
      } finally {
        setJoiningSlug(null);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold leading-[130%]">
            Communities
          </h1>
          <p className="text-grey mt-1.5">
            Discover academic communities around your interests
          </p>
        </div>
        <Button asChild variant="default">
          <Link href="/communities/create" className="gap-2">
            <Plus size={16} strokeWidth={2} />
            Create community
          </Link>
        </Button>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search
          size={18}
          strokeWidth={1.5}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-grey"
        />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search communities..."
          className="pl-11 h-12 bg-white rounded-xl border border-[#D9D9D9]"
        />
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 bg-white border border-[#D9D9D9] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#D9D9D9]">
          <p className="text-grey">
            No communities found. Be the first to create one.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                isMember={community.isMember}
                isOwner={community.owner.id === session?.user?.id}
                isPending={joiningSlug === community.slug}
                onToggleMembership={handleJoin}
              />
            ))}
          </div>

          {pagination && pagination.page < pagination.totalPages && (
            <div className="flex justify-center mt-10">
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
    </div>
  );
};

export default CommunitiesExplore;