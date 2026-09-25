"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { requestPasswordReset, describeAuthError } from "@/lib/auth/authService";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Icon name="check" size={22} />
        </span>
        <h1 className="text-lg font-semibold text-ink">Check your email</h1>
        <p className="text-sm text-ink-muted">
          If an account exists for <span className="font-medium text-ink">{email}</span>, a reset link is on its
          way.
        </p>
        <Link href="/login" className="focus-ring mt-2 text-sm font-medium text-accent hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/login" aria-label="Back to log in" className="focus-ring mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <Icon name="back" size={16} />
        Back
      </Link>
      <h1 className="text-xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter your email and we&apos;ll send you a reset link.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} fullWidth>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </>
  );
}
