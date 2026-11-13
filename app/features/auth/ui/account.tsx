import { data, Form, Link, redirect, useActionData, useLoaderData } from "react-router";

import { authText } from "~/content/auth";
import { common } from "~/content/common";
import {
  getProfile,
  getScreening,
  PARQ_VERSION,
  requireOnboardingSession,
} from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
import { Greeting } from "~/shared/ui/greeting";
import { Input } from "~/shared/ui/input";
import { getCurrentSession } from "../data/session";
import { authErrorCode } from "../domain/errors";
import { auth } from "../server";
import type { Route } from "./+types/account";

export function meta() {
  return [{ title: `${authText.account.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireOnboardingSession(request, "/cuenta");
  const currentProfile = await getProfile(session.user.id);

  if (!currentProfile) {
    return redirect("/onboarding");
  }

  if (!currentProfile.birthDate) {
    return redirect("/perfil");
  }

  const screening = await getScreening(session.user.id);

  if (!screening || screening.questionnaireVersion !== PARQ_VERSION) {
    return redirect("/salud");
  }

  return { preferredName: currentProfile.preferredName, email: session.user.email };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  if (formData.get("intent") === "delete") {
    return deleteAccount(request, formData);
  }

  const { headers } = await auth.api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });

  return redirect("/", { headers });
}

async function deleteAccount(request: Request, formData: FormData) {
  const session = await getCurrentSession(request);

  if (!session) {
    return redirect("/entrar");
  }

  const confirmation = String(formData.get("confirm") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (confirmation !== "ELIMINAR") {
    return data({ deleteError: authText.account.deleteConfirmError }, { status: 400 });
  }

  if (password.length === 0) {
    return data({ deleteError: authText.account.deletePasswordError }, { status: 400 });
  }

  try {
    const { headers } = await auth.api.deleteUser({
      headers: request.headers,
      body: { password },
      returnHeaders: true,
    });

    return redirect("/", { headers });
  } catch (error) {
    const code = authErrorCode(error);
    const message =
      code === "INVALID_PASSWORD"
        ? authText.account.deleteWrongPassword
        : authText.account.deleteGeneric;

    return data({ deleteError: message }, { status: 400 });
  }
}

export default function Account() {
  const { preferredName, email } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{authText.account.title}</h1>
        <p className="text-muted-foreground">
          <Greeting />, {preferredName}.
        </p>
      </div>

      <dl className="space-y-1 rounded-lg border border-border p-4">
        <dt className="text-sm text-muted-foreground">{authText.account.emailLabel}</dt>
        <dd className="font-medium break-all">{email}</dd>
      </dl>

      <nav className="flex flex-col gap-2 text-sm">
        <Link to="/plan" className="font-medium text-primary underline-offset-4 hover:underline">
          {authText.account.plan}
        </Link>
        <Link to="/imc" className="font-medium text-primary underline-offset-4 hover:underline">
          {authText.account.bmi}
        </Link>
        <Link to="/ajustes" className="font-medium text-primary underline-offset-4 hover:underline">
          {authText.account.settings}
        </Link>
      </nav>

      <p className="text-sm text-muted-foreground">{authText.account.soon}</p>

      <Form method="post">
        <input type="hidden" name="intent" value="signout" />
        <Button type="submit" variant="outline" className="w-full">
          {authText.account.signOut}
        </Button>
      </Form>

      <section className="space-y-3 rounded-lg border border-destructive/30 p-4">
        <h2 className="text-sm font-semibold text-destructive">{authText.account.deleteTitle}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {authText.account.deleteBody}
        </p>

        <Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="delete" />

          <div className="space-y-1">
            <label htmlFor="confirm" className="text-sm font-medium">
              {authText.account.deleteConfirmLabel}
            </label>
            <Input id="confirm" name="confirm" autoComplete="off" autoCapitalize="characters" />
          </div>

          <div className="space-y-1">
            <label htmlFor="delete-password" className="text-sm font-medium">
              {authText.account.deletePasswordLabel}
            </label>
            <Input
              id="delete-password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {actionData?.deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionData.deleteError}
            </p>
          ) : null}

          <Button type="submit" variant="destructive" className="w-full">
            {authText.account.deleteSubmit}
          </Button>
        </Form>
      </section>
    </main>
  );
}
