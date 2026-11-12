import type { ReactNode } from "react";
import { Link } from "react-router";

import { common } from "~/content/common";

type AuthShellProps = {
  title: string;
  subtitle: string;
  altText: string;
  altLink: string;
  altHref: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  altText,
  altLink,
  altHref,
  children,
}: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <Link
          to="/"
          className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase"
        >
          {common.appName}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>

      {children}

      <p className="text-center text-sm text-muted-foreground">
        {altText}{" "}
        <Link to={altHref} className="font-medium text-primary underline-offset-4 hover:underline">
          {altLink}
        </Link>
      </p>
    </main>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
