import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { authText } from "~/content/auth";
import { common } from "~/content/common";
import { safeRedirectPath } from "~/shared/lib/safe-redirect";
import { Button } from "~/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/shared/ui/field";
import { FormError } from "~/shared/ui/form";
import { Input } from "~/shared/ui/input";
import { requireGuest } from "../data/guards";
import { authErrorCode } from "../domain/errors";
import { signInSchema } from "../domain/schemas";
import { auth } from "../server";
import type { Route } from "./+types/login";
import { AuthShell } from "./auth-shell";

type ActionData = {
  fieldErrors: Partial<Record<"email" | "password", string[]>>;
  formError: string | null;
};

export function meta() {
  return [{ title: `${authText.login.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return requireGuest(request);
}

export async function action({ request }: Route.ActionArgs) {
  await requireGuest(request);

  const url = new URL(request.url);
  const redirectTo = safeRedirectPath(url.searchParams.get("redirectTo"), "/cuenta");
  const formData = await request.formData();
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const payload: ActionData = {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      formError: null,
    };

    return data(payload, { status: 400 });
  }

  try {
    const { headers } = await auth.api.signInEmail({
      body: parsed.data,
      returnHeaders: true,
    });

    return redirect(redirectTo, { headers });
  } catch (error) {
    const code = authErrorCode(error);
    const payload: ActionData = {
      fieldErrors: {},
      formError:
        code === "INVALID_EMAIL_OR_PASSWORD"
          ? authText.errors.badCredentials
          : authText.errors.generic,
    };

    return data(payload, { status: 400 });
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.fieldErrors;

  return (
    <AuthShell
      title={authText.login.title}
      subtitle={authText.login.subtitle}
      altText={authText.login.altText}
      altLink={authText.login.altLink}
      altHref={authText.login.altHref}
    >
      <Form method="post" className="space-y-4" noValidate>
        <FormError message={actionData?.formError} />

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="email">{authText.fields.email}</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="h-11"
              placeholder={authText.fields.emailPlaceholder}
              required
              aria-invalid={Boolean(errors?.email)}
            />
            <FieldError>{errors?.email?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">{authText.fields.password}</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-11"
              required
              aria-invalid={Boolean(errors?.password)}
            />
            <FieldError>{errors?.password?.[0]}</FieldError>
          </Field>
        </FieldGroup>

        <Button type="submit" size="lg" className="w-full">
          {authText.login.submit}
        </Button>
      </Form>
    </AuthShell>
  );
}
