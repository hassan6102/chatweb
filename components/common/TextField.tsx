"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Icon } from "./Icon";

export function TextField({
  label,
  error,
  className = "",
  type = "text",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (visible ? "text" : "password") : type;
  const inputClasses = [
    "focus-ring w-full rounded-lg border bg-surface-sunken px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint",
    error ? "border-danger/60 focus-visible:outline-danger" : "border-border",
    isPassword ? "pr-10" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClasses}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
          >
            <Icon name={visible ? "eyeOff" : "eye"} size={17} />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
