"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Loader2, Lock, Mail } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_ADMIN: "This account is not an administrator.",
  ADMIN_SUSPENDED:
    "This administrator account has been suspended. Contact support.",
  ADMIN_EMAIL_NOT_VERIFIED: "Please verify this account's email first.",
  INVALID_ADMIN_CREDENTIALS: "Invalid email or password.",
};

export default function AdminLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }

    startTransition(async () => {
      const res = await signIn("admin-credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (res?.error) {
        toast.error(ERROR_MESSAGES[res.error] ?? res.error);
        return;
      }
      if (res?.ok) {
        toast.success("Welcome back, administrator");
        router.push("/admin");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="admin-email"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@ivomohub.com"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            id="admin-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            Signing in…
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        ) : (
          "Sign in to Admin"
        )}
      </button>
    </form>
  );
}