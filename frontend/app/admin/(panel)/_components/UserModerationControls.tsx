"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface UserModerationControlsProps {
  userId: string;
  isSuspended: boolean;
  emailVerified: boolean;
  isSelf: boolean;
}

const UserModerationControls = ({
  userId,
  isSuspended,
  emailVerified,
  isSelf,
}: UserModerationControlsProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState<"suspend" | "verify" | null>(null);

  async function suspend() {
    const reason = window.prompt(
      "Reason for suspension (shown to the user in a notification)\n\nLeave empty to use a default reason.",
    );
    if (reason === null) return;
    setBusy("suspend");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend: true, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to suspend user");
      }
      toast.success("User suspended");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function unsuspend() {
    setBusy("suspend");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to unsuspend user");
      }
      toast.success("Suspension lifted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function toggleVerified() {
    setBusy("verify");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !emailVerified }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update email verification");
      }
      toast.success(emailVerified ? "Email unverified" : "Email verified");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {!isSelf ? (
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={isSuspended ? unsuspend : suspend}
        >
          {isSuspended ? "Unsuspend" : "Suspend"}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        disabled={!!busy}
        onClick={toggleVerified}
        title="Toggle verified email"
      >
        {emailVerified ? "Unverify" : "Verify"}
      </Button>
    </>
  );
};

export default UserModerationControls;