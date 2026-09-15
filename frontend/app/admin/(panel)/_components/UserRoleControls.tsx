"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface UserRoleControlsProps {
  userId: string;
  role: "USER" | "ADMIN";
  isSelf: boolean;
}

const UserRoleControls = ({ userId, role, isSelf }: UserRoleControlsProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = role === "ADMIN" ? "USER" : "ADMIN";
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update role");
      }
      toast.success(`User is now ${next}`);
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
      variant="outline"
      disabled={busy || isSelf}
      title={isSelf ? "You cannot change your own role" : undefined}
      onClick={toggle}
    >
      {role === "ADMIN" ? "Demote" : "Promote"}
    </Button>
  );
};

export default UserRoleControls;
