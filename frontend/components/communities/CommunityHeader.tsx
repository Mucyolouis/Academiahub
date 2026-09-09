"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, FileText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  joinCommunity,
  leaveCommunity,
} from "@/lib/communities/api";
import type { CommunityDetail } from "@/lib/communities/api";
import { getInitials } from "@/lib/messaging/utils";

type CommunityHeaderProps = {
  community: CommunityDetail;
};

const CommunityHeader = ({ community }: CommunityHeaderProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const isOwner = session?.user?.id === community.ownerId;

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["community", community.slug],
    });
    router.refresh();
  };

  const handleJoin = () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      try {
        await joinCommunity(community.slug);
        refresh();
      } catch {
        // toast handled by caller if needed
      }
    });
  };

  const handleLeave = () => {
    if (!session?.user) return;
    startTransition(async () => {
      try {
        await leaveCommunity(community.slug);
        refresh();
      } catch {
        // ignore
      }
    });
  };

  return (
    <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        {community.image ? (
          <div className="size-20 md:size-24 rounded-full overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={community.image}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="size-20 md:size-24 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-2xl shrink-0">
            {getInitials(community.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl md:text-2xl font-semibold leading-[130%]">
              {community.name}
            </h1>

            {!isOwner && (
              <Button
                variant={community.isMember ? "secondary" : "default"}
                disabled={isPending}
                onClick={community.isMember ? handleLeave : handleJoin}
              >
                {isPending
                  ? "Working..."
                  : community.isMember
                    ? "Leave"
                    : "Join community"}
              </Button>
            )}
          </div>

          <p className="text-grey mt-1.5 flex items-center gap-1.5">
            <span className="font-medium text-black">
              {community.owner.name || "Owner"}
            </span>
            {isOwner && <span>· you</span>}
          </p>

          <p className="mt-3 text-sm leading-6">{community.description}</p>

          <div className="flex items-center gap-5 mt-4 text-sm text-grey">
            <span className="flex items-center gap-1.5">
              <Users size={16} strokeWidth={1.5} />
              {community._count.members} member
              {community._count.members === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText size={16} strokeWidth={1.5} />
              {community._count.documents} publication
              {community._count.documents === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {community.members.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#D9D9D9]">
          <p className="text-xs font-medium text-grey uppercase tracking-wide mb-3">
            Members
          </p>
          <div className="flex items-center gap-2">
            {community.members.map(({ user }) =>
              user.image ? (
                <div
                  key={user.id}
                  className="size-9 rounded-full overflow-hidden border-2 border-white shadow-sm"
                  title={user.name || undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.image}
                    alt={user.name || "Member"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  key={user.id}
                  className="size-9 rounded-full bg-grey/25 flex items-center justify-center text-xs font-medium"
                  title={user.name || undefined}
                >
                  {getInitials(user.name || "?")}
                </div>
              ),
            )}
            <span className="ml-2 flex items-center gap-1 text-xs text-grey">
              <UserRound size={14} strokeWidth={1.5} />
              {community._count.members} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHeader;