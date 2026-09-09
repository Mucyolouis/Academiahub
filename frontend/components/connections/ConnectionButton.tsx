"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import {
  useConnectionStatus,
  useRemoveConnection,
  useRespondConnection,
  useSendConnectionRequest,
} from "@/lib/connections/hooks";
import { useCreateConversation } from "@/lib/messaging/hooks";
import { ApiError } from "@/lib/messaging/api";

interface ConnectionButtonProps {
  userId: string;
  className?: string;
}

export default function ConnectionButton({
  userId,
  className,
}: ConnectionButtonProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const statusQuery = useConnectionStatus(userId);
  const sendRequest = useSendConnectionRequest();
  const respond = useRespondConnection();
  const remove = useRemoveConnection();
  const createConversation = useCreateConversation();

  if (sessionStatus === "loading" || !session?.user?.id) return null;
  if (userId === session.user.id) return null;

  const status = statusQuery.data?.status;

  const handleConnect = async () => {
    try {
      await sendRequest.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to send connection request:", error);
    }
  };

  const handleAccept = async () => {
    if (!statusQuery.data?.connectionId) return;
    try {
      await respond.mutateAsync({
        connectionId: statusQuery.data.connectionId,
        action: "accept",
      });
    } catch (error) {
      console.error("Failed to accept connection request:", error);
    }
  };

  const handleDecline = async () => {
    if (!statusQuery.data?.connectionId) return;
    try {
      await respond.mutateAsync({
        connectionId: statusQuery.data.connectionId,
        action: "decline",
      });
    } catch (error) {
      console.error("Failed to decline connection request:", error);
    }
  };

  const handleRemove = async () => {
    if (!statusQuery.data?.connectionId) return;
    try {
      await remove.mutateAsync(statusQuery.data.connectionId);
    } catch (error) {
      console.error("Failed to remove connection:", error);
    }
  };

  const handleMessage = async () => {
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

  if (statusQuery.isLoading && !status) {
    return (
      <Button className={className} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (status === "none" || !status) {
    return (
      <Button
        className={className}
        onClick={handleConnect}
        disabled={sendRequest.isPending}
      >
        {sendRequest.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Connect
          </>
        )}
      </Button>
    );
  }

  if (status === "pending-sent") {
    return (
      <Button
        className={className}
        onClick={handleRemove}
        disabled={remove.isPending}
        title="Cancel request"
      >
        {remove.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UserMinus className="w-4 h-4" />
            Requested
          </>
        )}
      </Button>
    );
  }

  if (status === "pending-incoming") {
    return (
      <span className="inline-flex gap-2">
        <Button
          className={className}
          onClick={handleAccept}
          disabled={respond.isPending}
        >
          {respond.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Accept"
          )}
        </Button>
        <Button
          variant="outline"
          className={className}
          onClick={handleDecline}
          disabled={respond.isPending}
        >
          Decline
        </Button>
      </span>
    );
  }

  // accepted
  return (
    <Button
      className={className}
      onClick={handleMessage}
      disabled={createConversation.isPending}
    >
      {createConversation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        "Message"
      )}
    </Button>
  );
}