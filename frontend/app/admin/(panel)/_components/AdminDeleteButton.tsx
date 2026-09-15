"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  url: string;
  label: string;
  confirmMessage: string;
}

const AdminDeleteButton = ({
  url,
  label,
  confirmMessage,
}: DeleteButtonProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="destructive" disabled={busy} onClick={handleDelete}>
      {label}
    </Button>
  );
};

export default AdminDeleteButton;
