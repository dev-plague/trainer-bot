import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { authText } from "~/content/auth";
import { common } from "~/content/common";
import { Button } from "~/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/shared/ui/field";
import { FormError } from "~/shared/ui/form";
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

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="name">{authText.fields.name}</FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="h-11"
              placeholder={authText.fields.namePlaceholder}
              required
              aria-invalid={Boolean(errors?.name)}
            />
            <FieldError>{errors?.name?.[0]}</FieldError>
          </Field>

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
              autoComplete="new-password"
              className="h-11"
              placeholder={authText.fields.passwordPlaceholder}
              required
              minLength={8}
              aria-invalid={Boolean(errors?.password)}
            />
            <FieldError>{errors?.password?.[0]}</FieldError>
          </Field>
        </FieldGroup>

        <Button type="submit" size="lg" className="w-full">
          {authText.register.submit}
        </Button>
      </Form>
    </AuthShell>
  );
}
