import { cn } from '@/lib/utils';

const SIZES = { sm: 22, md: 26, lg: 40 } as const;

/** Mark: a tall panel (chat) beside two stacked tiles (artifacts). */
export function LogoMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <rect x="8" y="8" width="7" height="16" rx="2" fill="#f59e0b" />
      <rect x="17" y="8" width="7" height="7" rx="2" className="fill-background" />
      <rect x="17" y="17" width="7" height="7" rx="2" className="fill-background" fillOpacity={0.55} />
    </svg>
  );
}

export function Logo({
  size = 'md',
  showText = true,
  className,
}: {
  size?: keyof typeof SIZES;
  showText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={SIZES[size]} />
      {showText && size !== 'lg' && <span className="text-[15px] font-semibold tracking-tight">Workspace</span>}
    </span>
  );
}
