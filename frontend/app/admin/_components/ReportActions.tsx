"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface ReportActionsProps {
  reportId: string;
  documentId: string;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
}

const ReportActions = ({
  reportId,
  documentId,
  status,
}: ReportActionsProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(next: "REVIEWED" | "DISMISSED") {
    setBusy(next);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update report");
      }
      toast.success(`Report ${next.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteDocument() {
    if (
      !window.confirm(
        "Delete this document permanently? All pending reports against it will be marked reviewed.",
      )
    ) {
      return;
    }
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete document");
      }
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEWED" }),
      });
      toast.success("Document deleted and report resolved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={!!busy}
        onClick={() => updateStatus("DISMISSED")}
      >
        Dismiss
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!busy}
        onClick={() => updateStatus("REVIEWED")}
      >
        Mark reviewed
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={!!busy}
        onClick={deleteDocument}
      >
        Delete document
      </Button>
      {status !== "PENDING" ? (
        <span className="self-center text-xs text-gray-400">resolved</span>
      ) : null}
    </div>
  );
};

export default ReportActions;
