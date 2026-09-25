export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 self-start rounded-2xl bg-bubble-in px-3.5 py-3" aria-live="polite">
      <span className="sr-only">Typing…</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
