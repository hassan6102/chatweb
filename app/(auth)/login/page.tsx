"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithEmail, describeAuthError } from "@/lib/auth/authService";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      router.push("/");
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Welcome back</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Sign in to your account</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">Pick up where your conversations left off.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link href="/forgot-password" className="focus-ring mt-2 inline-flex text-xs font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} fullWidth className="mt-1">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-7 border-t border-border pt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/register" className="focus-ring font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
