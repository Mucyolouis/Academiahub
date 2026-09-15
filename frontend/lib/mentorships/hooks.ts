"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMentorProfile,
  fetchMentors,
  fetchMentorshipOverview,
  fetchOwnMentorProfile,
  respondToMentorshipRequest,
  saveMentorProfile,
  sendMentorshipRequest,
  updateMentorship,
} from "@/lib/mentorships/api";

// ─── Queries ───────────────────────────────────────────────────────────

export function useMentors(query = "") {
  return useQuery({
    queryKey: ["mentors", query],
    queryFn: () => fetchMentors(query),
  });
}

export function useMentorshipOverview() {
  return useQuery({
    queryKey: ["mentorships"],
    queryFn: fetchMentorshipOverview,
  });
}

export function useOwnMentorProfile() {
  return useQuery({
    queryKey: ["mentor-profile", "me"],
    queryFn: fetchOwnMentorProfile,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────

export function useSendMentorshipRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMentorshipRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
    },
  });
}

export function useRespondMentorshipRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accept" | "decline";
    }) => respondToMentorshipRequest(requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
}

export function useUpdateMentorship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mentorshipId,
      action,
    }: {
      mentorshipId: string;
      action: "end" | "complete";
    }) => updateMentorship(mentorshipId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorships"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
}

export function useSaveMentorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMentorProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
}

export function useDeleteMentorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMentorProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
}