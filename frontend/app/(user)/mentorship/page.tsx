"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Check, Handshake, Loader2, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptySection from "@/components/user/shared/EmptySection";
import BecomeMentorSection from "@/components/mentorship/BecomeMentorSection";
import MentorCard from "@/components/mentorship/MentorCard";
import {
  useMentorshipOverview,
  useMentors,
  useRespondMentorshipRequest,
  useUpdateMentorship,
} from "@/lib/mentorships/hooks";
import { formatTimeAgo } from "@/lib/notifications/formatTime";
import { getInitials } from "@/lib/messaging/utils";

type Tab = "browse" | "requests" | "active";

const TABS: { id: Tab; label: string }[] = [
  { id: "browse", label: "Find a mentor" },
  { id: "requests", label: "Requests" },
  { id: "active", label: "Active mentorships" },
];

export default function MentorshipPage() {
  const [tab, setTab] = useState<Tab>("browse");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const mentors = useMentors(debouncedQuery.trim().length >= 2 ? debouncedQuery : "");
  const overview = useMentorshipOverview();
  const respond = useRespondMentorshipRequest();
  const update = useUpdateMentorship();

  const handleRespond = (requestId: string, action: "accept" | "decline") => {
    respond.mutate(
      { requestId, action },
      {
        onSuccess: () => {
          toast.success(
            action === "accept" ? "Mentorship started" : "Request declined",
          );
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleEnd = (mentorshipId: string, action: "end" | "complete") => {
    update.mutate(
      { mentorshipId, action },
      {
        onSuccess: () => {
          toast.success(
            action === "complete" ? "Mentorship completed" : "Mentorship ended",
          );
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const isLoadingData =
    tab === "browse"
      ? mentors.isLoading
      : tab === "requests" || tab === "active"
        ? overview.isLoading
        : false;

  return (
    <main className="lg:px-6 m-2 lg:m-6 rounded lg:rounded-2xl bg-white lg:py-4 lg:mb-0 py-2">
      <header className="w-full md:bg-white py-2 md:py-7 px-2 md:px-4 mb-2 rounded-lg">
        <h1 className="font-medium max-sm:text-primary text-2xl">Mentorship</h1>
        <p className="text-sm text-gray-400 mt-1">
          Get guidance from experienced academics and professionals — or share
          your own expertise.
        </p>
      </header>

      <div className="px-2 md:px-4 mb-6">
        <BecomeMentorSection />
      </div>

      <div className="flex gap-1 px-2 md:px-4 mb-4 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm cursor-pointer border-b-2 transition-colors ${
              tab === t.id
                ? "text-primary border-primary font-medium"
                : "text-gray-500 border-transparent hover:text-gray-800"
            }`}
          >
            {t.label}
            {t.id === "requests" && overview.data?.incoming.length ? (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {overview.data.incoming.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <div className="relative mt-2 max-w-md px-2 md:px-4">
          <Search
            strokeWidth={1.5}
            className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mentors by name, title or expertise…"
            className="pl-9 text-gray-400 border rounded-xl"
          />
        </div>
      )}

      {isLoadingData && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {tab === "browse" && !mentors.isLoading && (
        <>
          {mentors.data && mentors.data.length === 0 ? (
            <EmptySection
              title="No mentors found"
              text="There are no approved mentors matching your search yet. Check back soon or become a mentor yourself."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 px-2 md:px-4 mt-4">
              {mentors.data?.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "requests" && !overview.isLoading && (
        <div className="space-y-6 px-2 md:px-4">
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Incoming requests
            </h2>
            {overview.data && overview.data.incoming.length === 0 ? (
              <EmptySection
                title="No incoming requests"
                text="When a mentee requests your mentorship, it will appear here."
              />
            ) : (
              <ul className="divide-y divide-gray-50 border rounded-lg overflow-hidden">
                {overview.data?.incoming.map((req) => (
                  <li
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage
                          src={req.requester.image || undefined}
                          alt={req.requester.name || "user"}
                        />
                        <AvatarFallback>
                          {getInitials(req.requester.name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {req.requester.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Topic: {req.topic}
                          {req.message ? ` · ${req.message}` : ""}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimeAgo(req.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(req.id, "accept")}
                        disabled={respond.isPending}
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(req.id, "decline")}
                        disabled={respond.isPending}
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Sent requests
            </h2>
            {overview.data && overview.data.sent.length === 0 ? (
              <EmptySection
                title="No sent requests"
                text="Requests you send to mentors will be listed here."
              />
            ) : (
              <ul className="divide-y divide-gray-50 border rounded-lg overflow-hidden">
                {overview.data?.sent.map((req) => (
                  <li key={req.id} className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage
                        src={req.mentor.image || undefined}
                        alt={req.mentor.name || "mentor"}
                      />
                      <AvatarFallback>
                        {getInitials(req.mentor.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {req.mentor.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Topic: {req.topic}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(req.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      Awaiting response
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "active" && !overview.isLoading && (
        <div className="px-2 md:px-4">
          {overview.data && overview.data.active.length === 0 ? (
            <EmptySection
              title="No active mentorships"
              text="Accept a request or ask an approved mentor to guide you."
            />
          ) : (
            <ul className="divide-y divide-gray-50 border rounded-lg overflow-hidden">
              {overview.data?.active.map((m) => {
                const isAsMentor = overview.data?.asMentor.some(
                  (x) => x.id === m.id,
                );
                const displayUser = isAsMentor ? m.mentee : m.mentor;
                return (
                  <li
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage
                          src={displayUser.image || undefined}
                          alt={displayUser.name || "user"}
                        />
                        <AvatarFallback>
                          {getInitials(displayUser.name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {displayUser.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {isAsMentor ? "Mentor role" : "Mentee"} · {m.topic}
                        </p>
                        <p className="text-xs text-gray-400">
                          Since {formatTimeAgo(m.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnd(m.id, "complete")}
                        disabled={update.isPending}
                        title="Mark as completed"
                      >
                        <Handshake className="h-4 w-4" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEnd(m.id, "end")}
                        disabled={update.isPending}
                        className="text-gray-400 hover:text-red-600"
                      >
                        End
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}