"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [vouchedBy, setVouchedBy] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !submitting &&
    !submitted &&
    username.trim().length >= 3 &&
    password.length >= 6 &&
    confirm.length >= 6 &&
    vouchedBy.trim().length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          vouchedBy: vouchedBy.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Registration failed");
        toast.error(data?.error ?? "Registration failed");
        return;
      }
      setSubmitted(true);
      toast.success("Your request has been sent to the admin");
    } catch {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <p className="text-sm text-muted-foreground">
          Submit a request. An admin will review and approve it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={submitted}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitted}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitted}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vouchedBy">Vouched by</Label>
        <Input
          id="vouchedBy"
          placeholder="Username of an existing member"
          value={vouchedBy}
          onChange={(e) => setVouchedBy(e.target.value)}
          disabled={submitted}
          required
        />
        <p className="text-xs text-muted-foreground">
          You need an active member to vouch for you. Without this, the request
          button stays disabled.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
      >
        {submitted
          ? "Request Pending"
          : submitting
          ? "Sending request..."
          : "Send Request"}
      </Button>

      <p className="text-center">
        <Link
          href="/reports/quarterly"
          className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60"
        >
          login
        </Link>
      </p>
    </form>
  );
}
