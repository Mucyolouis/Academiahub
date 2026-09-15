"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface InternshipVisibilityToggleProps {
  internshipId: string;
  hidden: boolean;
}

const InternshipVisibilityToggle = ({
  internshipId,
  hidden,
}: InternshipVisibilityToggleProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !hidden;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/internships/${internshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update listing");
      }
      toast.success(next ? "Internship hidden" : "Internship restored");
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
      variant={hidden ? "default" : "outline"}
      disabled={busy}
      onClick={toggle}
    >
      {hidden ? "Restore" : "Hide"}
    </Button>
  );
};

export default InternshipVisibilityToggle;