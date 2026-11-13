import { data, Form, Link, redirect, useActionData, useLoaderData } from "react-router";

import { authText } from "~/content/auth";
import { common } from "~/content/common";
import {
  getProfile,
  getScreening,
  PARQ_VERSION,
  requireOnboardingSession,
} from "~/features/onboarding";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/shared/ui/alert-dialog";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { Greeting } from "~/shared/ui/greeting";
import {
  AccountIcon,
  AlertIcon,
  ArrowRightIcon,
  BmiIcon,
  LogoutIcon,
  PlanIcon,
  SettingsIcon,
} from "~/shared/ui/icons";
import { Input } from "~/shared/ui/input";
import { PageHeader } from "~/shared/ui/page-header";
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
  const links = [
    { to: "/plan", label: authText.account.plan, Icon: PlanIcon },
    { to: "/imc", label: authText.account.bmi, Icon: BmiIcon },
    { to: "/ajustes", label: authText.account.settings, Icon: SettingsIcon },
  ];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={common.appName} title={authText.account.title} />

      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-4">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <AccountIcon size={26} />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="truncate text-lg font-semibold">
              <Greeting />, {preferredName}.
            </p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">
            {authText.account.title}
          </Badge>
        </CardContent>
      </Card>

      <nav aria-label="Secciones de la cuenta" className="grid gap-2 sm:grid-cols-3">
        {links.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon size={20} />
            </span>
            <span className="flex-1 text-sm font-medium">{label}</span>
            <ArrowRightIcon size={16} className="text-muted-foreground" />
          </Link>
        ))}
      </nav>

      <Form method="post">
        <input type="hidden" name="intent" value="signout" />
        <Button type="submit" variant="outline" className="w-full gap-2">
          <LogoutIcon size={18} />
          {authText.account.signOut}
        </Button>
      </Form>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertIcon size={18} />
            {authText.account.deleteTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {authText.account.deleteBody}
          </p>

          {actionData?.deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionData.deleteError}
            </p>
          ) : null}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                {authText.account.deleteSubmit}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{authText.account.deleteTitle}</AlertDialogTitle>
                <AlertDialogDescription>{authText.account.deleteBody}</AlertDialogDescription>
              </AlertDialogHeader>

              <Form method="post" className="space-y-3">
                <input type="hidden" name="intent" value="delete" />
                <div className="space-y-1">
                  <label htmlFor="confirm" className="text-sm font-medium">
                    {authText.account.deleteConfirmLabel}
                  </label>
                  <Input id="confirm" name="confirm" autoComplete="off" />
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

                <AlertDialogFooter>
                  <AlertDialogCancel type="button">{authText.account.cancel}</AlertDialogCancel>
                  <Button type="submit" variant="destructive">
                    {authText.account.deleteSubmit}
                  </Button>
                </AlertDialogFooter>
              </Form>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
