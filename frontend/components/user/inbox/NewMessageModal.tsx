"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Lock, Search, SquarePen } from "lucide-react";
import { useUserSearch, useCreateConversation } from "@/lib/messaging/hooks";
import { ApiError } from "@/lib/messaging/api";
import { getInitials } from "@/lib/messaging/utils";
import { cn } from "@/lib/utils";

interface NewMessageModalProps {
  className?: string;
  children?: React.ReactNode;
}

export default function NewMessageModal({
  className,
  children,
}: NewMessageModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const search = useUserSearch(query);
  const createConversation = useCreateConversation();

  const results = search.data ?? [];
  const canMessage = (connectionStatus?: string) =>
    connectionStatus === "accepted";

  const handleSelect = async (userId: string) => {
    try {
      const conversation = await createConversation.mutateAsync(userId);
      router.push(`/inbox?c=${conversation.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "MESSAGES_DISABLED") {
        console.error("This user has disabled messages.");
      } else {
        console.error("Failed to create conversation:", error);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <button className={cn("cursor-pointer flex items-center gap-1 font-medium text-primary text-sm", className)}>
            <SquarePen className="w-4 h-4" />
            New message
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Search for someone you&apos;re connected with to start a conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300"
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="pl-8 text-gray-400 border rounded-xl"
          />
        </div>

        <section className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {query.length > 0 && query.length < 3 && (
            <p className="text-xs text-gray-400 text-center py-6 px-2">
              Type at least 3 characters to search.
            </p>
          )}

          {query.length >= 3 && search.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

          {query.length >= 3 && !search.isLoading && results.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6 px-2">
              No users found. Note that only users who opted in to search appear here.
            </p>
          )}

          {results.map((user) => {
            const allowed = canMessage(user.connectionStatus);
            return (
              <button
                key={user.id}
                disabled={!allowed || createConversation.isPending}
                onClick={() => handleSelect(user.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  allowed
                    ? "hover:bg-gray-50 cursor-pointer"
                    : "opacity-60 cursor-not-allowed",
                )}
              >
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={user.image || undefined} alt={user.name || "avatar"} />
                  <AvatarFallback>{getInitials(user.name || "")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-4.5 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 leading-3.5">
                    {allowed
                      ? createConversation.isPending
                        ? "Creating conversation…"
                        : "Connected"
                      : "Not connected yet"}
                  </p>
                </div>
                {!allowed && <Lock className="w-4 h-4 text-gray-300" />}
              </button>
            );
          })}
        </section>
      </DialogContent>
    </Dialog>
  );
}