import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { onboardingText } from "~/content/onboarding";
import { getCurrentSession } from "~/features/auth";
import { Button } from "~/shared/ui/button";
import { Input } from "~/shared/ui/input";
import { getAcceptedConsents } from "../data/consents";
import { getProfile, saveProfile } from "../data/profile";
import { ADDRESS_FORMS, DEFAULT_ADDRESS_FORM } from "../domain/address-form";
import { missingConsents } from "../domain/consents";
import { profileSetupSchema } from "../domain/profile";
import type { Route } from "./+types/onboarding";

export function meta() {
  return [{ title: `${onboardingText.preferredName.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getCurrentSession(request);

  if (!session) {
    return redirect(`/entrar?redirectTo=${encodeURIComponent("/onboarding")}`);
  }

  const accepted = await getAcceptedConsents(session.user.id);

  if (missingConsents(accepted).length > 0) {
    return redirect("/consentimiento");
  }

  const currentProfile = await getProfile(session.user.id);

  if (currentProfile) {
    return redirect("/cuenta");
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getCurrentSession(request);

  if (!session) {
    return redirect(`/entrar?redirectTo=${encodeURIComponent("/onboarding")}`);
  }

  const accepted = await getAcceptedConsents(session.user.id);

  if (missingConsents(accepted).length > 0) {
    return redirect("/consentimiento");
  }

  const formData = await request.formData();
  const parsed = profileSetupSchema.safeParse({
    preferredName: formData.get("preferredName"),
    addressForm: formData.get("addressForm") ?? undefined,
  });

  if (!parsed.success) {
    return data({ fieldErrors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }

  await saveProfile({ userId: session.user.id, ...parsed.data });

  return redirect("/cuenta");
}

export default function Onboarding() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.fieldErrors;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {onboardingText.preferredName.title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {onboardingText.preferredName.subtitle}
        </p>
      </div>

      <Form method="post" className="space-y-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="preferredName" className="text-sm font-medium">
            {onboardingText.preferredName.nameLabel}
          </label>
          <Input
            id="preferredName"
            name="preferredName"
            autoComplete="nickname"
            maxLength={40}
            placeholder={onboardingText.preferredName.namePlaceholder}
            required
            aria-invalid={Boolean(errors?.preferredName)}
            aria-describedby={errors?.preferredName ? "preferredName-error" : undefined}
          />
          {errors?.preferredName?.[0] ? (
            <p id="preferredName-error" className="text-sm text-destructive">
              {errors.preferredName[0]}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {onboardingText.preferredName.addressLabel}
          </legend>
          <p className="text-xs text-muted-foreground">
            {onboardingText.preferredName.addressHelp}
          </p>
          <div className="grid gap-2">
            {ADDRESS_FORMS.map((form) => (
              <label
                key={form}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5"
              >
                <input
                  type="radio"
                  name="addressForm"
                  value={form}
                  defaultChecked={form === DEFAULT_ADDRESS_FORM}
                  className="size-4 accent-primary"
                />
                {onboardingText.preferredName.options[form]}
              </label>
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" className="w-full">
          {onboardingText.preferredName.submit}
        </Button>
      </Form>
    </main>
  );
}
