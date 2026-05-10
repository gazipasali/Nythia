"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!res) {
        setError("Sign in failed. Please try again.");
        return;
      }

      if (res.error) {
        const code = res.code ?? res.error;
        if (code === "AccountPending" || code?.includes("AccountPending")) {
          setError("Your account is awaiting admin approval.");
        } else if (
          code === "AccountRejected" ||
          code?.includes("AccountRejected")
        ) {
          setError("Your registration was rejected.");
        } else if (
          code === "TooManyAttempts" ||
          code?.includes("TooManyAttempts")
        ) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError("Invalid username or password.");
        }
        return;
      }

      toast.success("Welcome back");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to continue.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center">
        <Link
          href="/reports/access"
          className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60"
        >
          register
        </Link>
      </p>
    </form>
  );
}
