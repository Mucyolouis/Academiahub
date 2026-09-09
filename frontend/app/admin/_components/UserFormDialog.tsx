"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormDialogProps {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: "USER" | "ADMIN";
  } | null;
}

const UserFormDialog = ({ user }: UserFormDialogProps) => {
  const router = useRouter();
  const isEdit = !!user;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [verified, setVerified] = useState(true);

  function openDialog() {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setRole(user?.role ?? "USER");
    setVerified(true);
    setError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setBusy(false);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          ...(password ? { password } : {}),
          ...(isEdit
            ? role !== user!.role
              ? { role }
              : {}
            : { role }),
          ...(isEdit ? {} : { emailVerified: verified }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to save user");
      }
      toast.success(isEdit ? "User updated" : "User created");
      router.refresh();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? openDialog() : close())}>
      <Button
        size="sm"
        variant={isEdit ? "outline" : "default"}
        onClick={openDialog}
        className={isEdit ? "" : "flex items-center gap-1.5"}
      >
        {isEdit ? <Pencil size={14} /> : <Plus size={14} />}
        {isEdit ? "Edit" : "Create"}
      </Button>

      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit user" : "Create user"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the account details. Leave the password blank to keep the current one."
                : "Create a new account. The user can sign in with these credentials."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-password">
                {isEdit ? "New password" : "Password"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isEdit ? "Leave blank to keep current" : "At least 8 characters"
                }
                required={!isEdit}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "USER" | "ADMIN")}>
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isEdit ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="user-verified"
                  checked={verified}
                  onCheckedChange={setVerified}
                />
                <Label htmlFor="user-verified">Mark email as verified</Label>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;