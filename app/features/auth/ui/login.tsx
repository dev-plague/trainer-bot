import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { authText } from "~/content/auth";
import { common } from "~/content/common";
import { safeRedirectPath } from "~/shared/lib/safe-redirect";
import { Button } from "~/shared/ui/button";
import { FieldError, FormError } from "~/shared/ui/form";
import { Input } from "~/shared/ui/input";
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

export async function action({ request }: Route.ActionArgs) {
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

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {authText.fields.email}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={authText.fields.emailPlaceholder}
            required
            aria-invalid={Boolean(errors?.email)}
            aria-describedby={errors?.email ? "email-error" : undefined}
          />
          <FieldError id="email-error" message={errors?.email?.[0]} />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            {authText.fields.password}
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(errors?.password)}
            aria-describedby={errors?.password ? "password-error" : undefined}
          />
          <FieldError id="password-error" message={errors?.password?.[0]} />
        </div>

        <Button type="submit" size="lg" className="w-full">
          {authText.login.submit}
        </Button>
      </Form>
    </AuthShell>
  );
}
