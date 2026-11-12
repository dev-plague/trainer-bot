import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { common } from "~/content/common";
import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = common.errors.unexpectedTitle;
  let detail = common.errors.unexpectedDetail;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? common.errors.notFoundTitle : common.errors.errorTitle;
    detail = error.status === 404 ? common.errors.notFoundDetail : error.statusText || detail;
  } else if (import.meta.env.DEV && error instanceof Error) {
    detail = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{detail}</p>
      {stack ? (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
}
