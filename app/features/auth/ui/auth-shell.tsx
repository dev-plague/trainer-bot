import type { ReactNode } from "react";
import { Link } from "react-router";

import { common } from "~/content/common";
import { Card, CardContent } from "~/shared/ui/card";
import { BrandMark } from "~/shared/ui/page-header";

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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <Link to="/" className="flex items-center gap-3 self-start">
        <BrandMark />
        <span className="font-semibold tracking-tight">{common.appName}</span>
      </Link>

      <Card className="shadow-sm">
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {altText}{" "}
        <Link to={altHref} className="font-medium text-primary underline-offset-4 hover:underline">
          {altLink}
        </Link>
      </p>
    </div>
  );
}
