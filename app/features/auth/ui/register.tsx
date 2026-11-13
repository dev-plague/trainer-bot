import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { authText } from "~/content/auth";
import { common } from "~/content/common";
import { Button } from "~/shared/ui/button";
import { FieldError, FormError } from "~/shared/ui/form";
import { Input } from "~/shared/ui/input";
import { requireGuest } from "../data/guards";
import { authErrorCode } from "../domain/errors";
import { signUpSchema } from "../domain/schemas";
import { auth } from "../server";
import type { Route } from "./+types/register";
import { AuthShell } from "./auth-shell";

type ActionData = {
  fieldErrors: Partial<Record<"name" | "email" | "password", string[]>>;
  formError: string | null;
};

export function meta() {
  return [{ title: `${authText.register.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return requireGuest(request);
}

export async function action({ request }: Route.ActionArgs) {
  await requireGuest(request);

  const formData = await request.formData();
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const payload: ActionData = {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      formError: null,
    };

    return data(payload, { status: 400 });
  }

  try {
    const { headers } = await auth.api.signUpEmail({
      body: parsed.data,
      returnHeaders: true,
    });

    return redirect("/consentimiento", { headers });
  } catch (error) {
    const code = authErrorCode(error);
    const emailTaken = code?.startsWith("USER_ALREADY_EXISTS") ?? false;
    const payload: ActionData = {
      fieldErrors: {},
      formError: emailTaken ? authText.errors.emailTaken : authText.errors.generic,
    };

    return data(payload, { status: 400 });
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.fieldErrors;

  return (
    <AuthShell
      title={authText.register.title}
      subtitle={authText.register.subtitle}
      altText={authText.register.altText}
      altLink={authText.register.altLink}
      altHref={authText.register.altHref}
    >
      <Form method="post" className="space-y-4" noValidate>
        <FormError message={actionData?.formError} />

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            {authText.fields.name}
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={authText.fields.namePlaceholder}
            required
            aria-invalid={Boolean(errors?.name)}
            aria-describedby={errors?.name ? "name-error" : undefined}
          />
          <FieldError id="name-error" message={errors?.name?.[0]} />
        </div>

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
            autoComplete="new-password"
            placeholder={authText.fields.passwordPlaceholder}
            required
            minLength={8}
            aria-invalid={Boolean(errors?.password)}
            aria-describedby={errors?.password ? "password-error" : undefined}
          />
          <FieldError id="password-error" message={errors?.password?.[0]} />
        </div>

        <Button type="submit" size="lg" className="w-full">
          {authText.register.submit}
        </Button>
      </Form>
    </AuthShell>
  );
}
