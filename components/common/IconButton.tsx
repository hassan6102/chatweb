import { forwardRef, type ButtonHTMLAttributes } from "react";

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string; active?: boolean }
>(function IconButton({ className = "", active, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-surface-sunken text-accent" : ""} ${className}`}
      {...props}
    />
  );
});
