export function TypingIndicator({ label = 'Thinking' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-current"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}
