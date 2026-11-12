import { Form, redirect, useLoaderData } from "react-router";

import { authText } from "~/content/auth";
import { common } from "~/content/common";
import { getAcceptedConsents, missingConsents } from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
import { getCurrentSession } from "../data/session";
import { auth } from "../server";
import type { Route } from "./+types/account";

export function meta() {
  return [{ title: `${authText.account.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getCurrentSession(request);

  if (!session) {
    const url = new URL(request.url);

    return redirect(`/entrar?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  const accepted = await getAcceptedConsents(session.user.id);

  if (missingConsents(accepted).length > 0) {
    return redirect("/consentimiento");
  }

  return { name: session.user.name, email: session.user.email };
}

export async function action({ request }: Route.ActionArgs) {
  const { headers } = await auth.api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });

  return redirect("/", { headers });
}

export default function Account() {
  const { name, email } = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{authText.account.title}</h1>
        <p className="text-muted-foreground">
          {authText.account.greeting}, {name}.
        </p>
      </div>

      <dl className="space-y-1 rounded-lg border border-border p-4">
        <dt className="text-sm text-muted-foreground">{authText.account.emailLabel}</dt>
        <dd className="font-medium break-all">{email}</dd>
      </dl>

      <p className="text-sm text-muted-foreground">{authText.account.soon}</p>

      <Form method="post">
        <Button type="submit" variant="outline" className="w-full">
          {authText.account.signOut}
        </Button>
      </Form>
    </main>
  );
}
