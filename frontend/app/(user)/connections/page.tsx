"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserCheck, UserMinus } from "lucide-react";
import EmptySection from "@/components/user/shared/EmptySection";
import ConnectionButton from "@/components/connections/ConnectionButton";
import { useConnections, useRemoveConnection } from "@/lib/connections/hooks";
import { formatTimeAgo } from "@/lib/notifications/formatTime";
import { getInitials } from "@/lib/messaging/utils";
import type { ConnectionListItem } from "@/app/_types/messaging";

type Tab = "incoming" | "sent" | "accepted";

const TABS: { id: Tab; label: string }[] = [
  { id: "incoming", label: "Requests" },
  { id: "sent", label: "Sent" },
  { id: "accepted", label: "Connections" },
];

function ConnectionRow({
  item,
  tab,
}: {
  item: ConnectionListItem;
  tab: Tab;
}) {
  const remove = useRemoveConnection();
  const handleRemove = async () => {
    await remove.mutateAsync(item.id);
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg">
      <Link href={`/profile/${item.user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={item.user.image || undefined} alt={item.user.name || "avatar"} />
          <AvatarFallback>{getInitials(item.user.name || "")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-4.5 truncate">{item.user.name}</p>
          <p className="text-xs text-gray-400 leading-3.5">
            {formatTimeAgo(item.createdAt)}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        {tab === "incoming" && (
          <ConnectionButton userId={item.user.id} />
        )}
        {tab === "sent" && (
          <>
            <span className="text-xs text-gray-400 mr-1">Pending</span>
            <ConnectionButton userId={item.user.id} />
          </>
        )}
        {tab === "accepted" && (
          <>
            <ConnectionButton userId={item.user.id} />
            <button
              onClick={handleRemove}
              disabled={remove.isPending}
              className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
              title="Remove connection"
            >
              {remove.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserMinus className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>("incoming");
  const { data, isLoading } = useConnections(tab);

  return (
    <main className="lg:px-6 m-2 lg:m-6 rounded lg:rounded-2xl bg-white lg:py-4 lg:mb-0 py-2">
      <header className="w-full md:bg-white py-2 md:py-7 px-2 mb-4 rounded-lg">
        <h1 className="font-medium max-sm:text-primary text-2xl">Connections</h1>
        <p className="text-sm text-gray-400 mt-1">
          Connect with other academics to message them and collaborate.
        </p>
      </header>

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
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <EmptySection
          title={
            tab === "incoming"
              ? "No connection requests"
              : tab === "sent"
                ? "No pending requests sent"
                : "No connections yet"
          }
          text={
            tab === "incoming"
              ? "When someone requests to connect, it will show up here."
              : tab === "sent"
                ? "Requests you send will appear here until they're answered."
                : "Accept requests or send your own to start messaging."
          }
        />
      )}

      {!isLoading && data && data.length > 0 && (
        <ul className="divide-y divide-gray-50 px-2 md:px-4">
          {data.map((item) => (
            <ConnectionRow key={item.id} item={item} tab={tab} />
          ))}
        </ul>
      )}

      {tab === "incoming" && data && data.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400">
          <UserCheck className="w-4 h-4" />
          Accept to start messaging. Declined requests can be sent again later.
        </div>
      )}
    </main>
  );
}