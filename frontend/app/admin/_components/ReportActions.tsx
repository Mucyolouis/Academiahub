"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReportActionsProps {
  reportId: string;
  status: "PENDING" | "REVIEWED" | "DISMISSED";
}

type Resolution =
  | "DELETED"
  | "HIDDEN"
  | "WARNED"
  | "SUSPENDED"
  | "DISMISSED";

const ReportActions = ({
  reportId,
  status,
}: ReportActionsProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState<Resolution | "reviewed" | null>(null);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  async function resolve(resolution: Resolution, withNote?: string) {
    setBusy(resolution);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, note: withNote || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to resolve report");
      }
      toast.success(`Report ${resolution.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
      setNote("");
      setNoteOpen(false);
    }
  }

  async function markReviewed() {
    setBusy("reviewed");
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEWED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update report");
      }
      toast.success("Report marked reviewed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    if (
      !window.confirm(
        "Delete this document permanently? The file is removed from storage and the report is resolved.",
      )
    ) {
      return;
    }
    resolve("DELETED");
  }

  const resolved = status !== "PENDING";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy || resolved}
          onClick={markReviewed}
        >
          Mark reviewed
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy || resolved}
          onClick={() => resolve("DISMISSED")}
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy || resolved}
          onClick={() => resolve("HIDDEN")}
        >
          Hide document
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy || resolved}
          onClick={() => {
            setNoteOpen(true);
          }}
        >
          Warn author
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy || resolved}
          onClick={() => setNoteOpen(true)}
        >
          Suspend author
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={!!busy || resolved}
          onClick={confirmDelete}
        >
          Delete document
        </Button>
      </div>

      {noteOpen && !resolved ? (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note shown to the author (e.g. the reason)."
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!!busy}
              onClick={() => resolve("WARNED", note)}
            >
              Confirm warning
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!!busy}
              onClick={() => resolve("SUSPENDED", note)}
            >
              Confirm suspension
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!!busy}
              onClick={() => {
                setNoteOpen(false);
                setNote("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {resolved ? (
        <span className="text-xs text-gray-400">resolved</span>
      ) : null}
    </div>
  );
};

export default ReportActions;