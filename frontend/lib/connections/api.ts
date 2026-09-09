import type {
  ConnectionListItem,
  ConnectionStatusResult,
  ConnectionStatusValue,
} from "@/app/_types/messaging";

export interface Connection {
  id: string;
  userAId: string;
  userBId: string;
  requesterId: string;
  status: "PENDING" | "ACCEPTED" | "REMOVED";
  createdAt: string;
  updatedAt: string;
}

interface ConnectionListResponse {
  connections: ConnectionListItem[];
}

interface SendConnectionResponse {
  connection: Connection;
}

interface ConnectionStatusResponse {
  status: ConnectionStatusValue;
  connectionId: string | null;
}

async function jsonFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(body.error ?? `Request failed (${res.status})`) as Error & {
      status: number;
    };
    error.status = res.status;
    throw error;
  }

  return body as T;
}

export async function fetchConnections(
  scope: "incoming" | "sent" | "accepted" = "incoming",
): Promise<ConnectionListItem[]> {
  const data = await jsonFetch<ConnectionListResponse>(
    `/api/connections?scope=${scope}`,
  );
  return data.connections;
}

export async function sendConnectionRequest(userId: string): Promise<Connection> {
  const data = await jsonFetch<SendConnectionResponse>("/api/connections", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return data.connection;
}

export async function fetchConnectionStatus(
  userId: string,
): Promise<ConnectionStatusResult> {
  const data = await jsonFetch<ConnectionStatusResponse>(
    `/api/connections/status?userId=${encodeURIComponent(userId)}`,
  );
  return data;
}

export async function respondToConnectionRequest(
  connectionId: string,
  action: "accept" | "decline",
): Promise<void> {
  await jsonFetch(`/api/connections/${connectionId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export async function removeConnection(connectionId: string): Promise<void> {
  await jsonFetch(`/api/connections/${connectionId}`, {
    method: "DELETE",
  });
}