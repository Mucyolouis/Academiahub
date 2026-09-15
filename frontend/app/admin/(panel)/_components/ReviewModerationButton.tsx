"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

const ReviewModerationButton = ({
  reviewId,
  isHidden,
}: {
  reviewId: string;
  isHidden: boolean;
}) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update review");
      }
      toast.success(isHidden ? "Review shown" : "Review hidden");
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
      variant={isHidden ? "default" : "outline"}
      disabled={busy}
      onClick={toggle}
    >
      {isHidden ? "Show" : "Hide"}
    </Button>
  );
};

export default ReviewModerationButton;