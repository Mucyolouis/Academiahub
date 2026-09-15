"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Loader2, Power, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MentorStatusControlsProps {
  profileId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DEACTIVATED";
}

const MentorStatusControls = ({
  profileId,
  status,
}: MentorStatusControlsProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(next: "APPROVED" | "REJECTED" | "DEACTIVATED") {
    setBusy(next);
    try {
      const res = await fetch(`/api/admin/mentor-profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      toast.success(
        next === "APPROVED"
          ? "Mentor approved"
          : next === "REJECTED"
            ? "Application rejected"
            : "Mentor deactivated",
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-1.5">
      {status !== "APPROVED" ? (
        <Button
          size="sm"
          variant="default"
          disabled={busy !== null}
          onClick={() => setStatus("APPROVED")}
        >
          {busy === "APPROVED" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Approve
        </Button>
      ) : null}
      {status !== "DEACTIVATED" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => setStatus("DEACTIVATED")}
        >
          {busy === "DEACTIVATED" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Power className="h-3.5 w-3.5" />
          )}
          Deactivate
        </Button>
      ) : null}
      {status !== "REJECTED" ? (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:text-red-700 border-red-200"
          disabled={busy !== null}
          onClick={() => setStatus("REJECTED")}
        >
          {busy === "REJECTED" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Reject
        </Button>
      ) : null}
    </div>
  );
};

export default MentorStatusControls;