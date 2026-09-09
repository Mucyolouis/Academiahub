"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConnectionStatus,
  fetchConnections,
  respondToConnectionRequest,
  removeConnection,
  sendConnectionRequest,
} from "@/lib/connections/api";
import type { ConnectionListItem, ConnectionStatusResult } from "@/app/_types/messaging";

export function useConnectionStatus(userId: string | null | undefined) {
  return useQuery<ConnectionStatusResult>({
    queryKey: ["connectionStatus", userId],
    queryFn: () => fetchConnectionStatus(userId!),
    enabled: !!userId,
  });
}

export function useConnections(scope: "incoming" | "sent" | "accepted" = "incoming") {
  return useQuery<ConnectionListItem[]>({
    queryKey: ["connections", scope],
    queryFn: () => fetchConnections(scope),
  });
}

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => sendConnectionRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["connectionStatus"] });
    },
  });
}

export function useRespondConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, action }: { connectionId: string; action: "accept" | "decline" }) =>
      respondToConnectionRequest(connectionId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["connectionStatus"] });
    },
  });
}

export function useRemoveConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => removeConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["connectionStatus"] });
    },
  });
}