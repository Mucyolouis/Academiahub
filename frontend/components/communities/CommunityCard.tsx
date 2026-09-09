"use client";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommunitySummary } from "@/lib/communities/api";
import { getInitials } from "@/lib/messaging/utils";

type CommunityCardProps = {
  community: CommunitySummary;
  isMember?: boolean;
  isOwner?: boolean;
  onToggleMembership?: (slug: string) => void;
  isPending?: boolean;
};

const CommunityCard = ({
  community,
  isMember = false,
  isOwner = false,
  onToggleMembership,
  isPending = false,
}: CommunityCardProps) => {
  const showJoinButton = !isOwner && !isMember;

  return (
    <article className="w-full bg-white border border-[#D9D9D9] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {community.image ? (
          <div className="size-12 rounded-full overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={community.image}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="size-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-base shrink-0">
            {getInitials(community.name)}
          </div>
        )}
        <div className="min-w-0">
          <Link
            href={`/communities/${community.slug}`}
            className="font-medium leading-[130%] truncate block hover:text-primary"
          >
            {community.name}
          </Link>
          <p className="text-grey text-xs leading-[130%] flex items-center gap-1">
            <Users size={12} strokeWidth={1.5} />
            {community._count.members} member
            {community._count.members === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <p className="text-sm text-grey leading-6 line-clamp-2">
        {community.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-1">
        <Link
          href={`/communities/${community.slug}`}
          className="text-xs text-primary font-medium hover:underline"
        >
          View community
        </Link>

        {showJoinButton && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => onToggleMembership?.(community.slug)}
          >
            {isPending ? "Joining..." : "Join"}
          </Button>
        )}

        {isMember && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            Joined
          </span>
        )}
      </div>
    </article>
  );
};

export default CommunityCard;