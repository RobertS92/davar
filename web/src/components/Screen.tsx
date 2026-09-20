import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  /** Extra bottom space for the mobile tab bar */
  withTabBar?: boolean;
  /** Disable outer scroll (player / read modes) */
  flush?: boolean;
};

/**
 * Consistent native-style screen: fills viewport height,
 * scrolls internally, respects safe areas and tab bar.
 */
export function Screen({
  children,
  className,
  withTabBar = true,
  flush = false,
}: ScreenProps) {
  if (flush) {
    return <div className={cn("flex min-h-0 flex-1 flex-col", className)}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "screen-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain",
        withTabBar ? "pb-tab" : "pb-safe",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "safe-top sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-white/[0.04] bg-ink-950/80 px-5 pb-3 pt-2 backdrop-blur-xl",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white">
          {title}
        </h1>
        {subtitle ? <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0 pt-1">{right}</div> : null}
    </header>
  );
}
