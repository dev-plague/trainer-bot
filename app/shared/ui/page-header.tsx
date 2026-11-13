import type { ReactNode } from "react";

import { cn } from "~/shared/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, children, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
    >
      <span className="text-base font-bold">T</span>
    </span>
  );
}
