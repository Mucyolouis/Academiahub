"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface DocumentStatusToggleProps {
  documentId: string;
  status: "PUBLISHED" | "HIDDEN";
}

const DocumentStatusToggle = ({
  documentId,
  status,
}: DocumentStatusToggleProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      toast.success(next === "HIDDEN" ? "Document hidden" : "Document published");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={status === "HIDDEN" ? "default" : "outline"}
      disabled={busy}
      onClick={toggle}
    >
      {status === "HIDDEN" ? "Publish" : "Hide"}
    </Button>
  );
};

export default DocumentStatusToggle;