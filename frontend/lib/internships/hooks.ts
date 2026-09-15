"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyToInternship,
  createInternship,
  fetchInternshipApplications,
  fetchInternshipDetail,
  fetchInternships,
  fetchMyApplications,
  updateApplicationStatus,
} from "@/lib/internships/api";

// ─── Queries ───────────────────────────────────────────────────────────

export function useInternships(params?: { q?: string; type?: string }) {
  return useQuery({
    queryKey: ["internships", params?.q ?? "", params?.type ?? ""],
    queryFn: () => fetchInternships(params),
  });
}

export function useInternshipDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ["internships", "detail", id],
    queryFn: () => fetchInternshipDetail(id!),
    enabled: !!id,
  });
}

export function useInternshipApplications(id: string | null | undefined) {
  return useQuery({
    queryKey: ["internships", "applications", id],
    queryFn: () => fetchInternshipApplications(id!),
    enabled: !!id,
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: ["internships", "my-applications"],
    queryFn: fetchMyApplications,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────

export function useCreateInternship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInternship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internships"] });
    },
  });
}

export function useApplyToInternship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyToInternship,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["internships", "detail", variables.internshipId],
      });
      queryClient.invalidateQueries({ queryKey: ["internships", "my-applications"] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      internshipId,
      applicationId,
      status,
    }: {
      internshipId: string;
      applicationId: string;
      status: "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
    }) => updateApplicationStatus(internshipId, applicationId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["internships", "applications", variables.internshipId],
      });
      queryClient.invalidateQueries({ queryKey: ["internships", "my-applications"] });
    },
  });
}