"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerWithEmail, describeAuthError } from "@/lib/auth/authService";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // الحقل الجديد لرقم الموبايل
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const confirmError = useMemo(
    () => (confirm && confirm !== password ? "Passwords don't match." : undefined),
    [confirm, password]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (password !== confirm) return;
    setSubmitting(true);
    try {
      // تمرير رقم الموبايل كمتغير ثالث لدالة التسجيل
      await registerWithEmail(email, password, phoneNumber);
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Get started</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          You&apos;ll get a unique User ID to share with people you chat with.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <TextField
          label="Phone Number"
          type="tel"
          required
          autoComplete="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <p className="-mt-3 text-xs leading-5 text-ink-faint">
          Your phone number is private and is only visible to authorized administrators.
        </p>

        <TextField
          label="Password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError}
        />

        {error && (
          <p role="alert" aria-live="polite" className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting || !!confirmError} fullWidth className="mt-1">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-7 border-t border-border pt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="focus-ring font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}