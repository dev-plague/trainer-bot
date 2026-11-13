import { data, Form, redirect, useActionData, useLoaderData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { onboardingText } from "~/content/onboarding";
import { Button } from "~/shared/ui/button";
import { FieldError, FormError } from "~/shared/ui/form";
import { Input } from "~/shared/ui/input";
import { requireOnboardingSession } from "../data/guards";
import { getProfile, saveProfileDetails } from "../data/profile";
import { ADULT_AGE, calculateAge } from "../domain/age";
import { profileDetailsSchema } from "../domain/profile";
import type { Route } from "./+types/profile-details";

type ActionData = {
  fieldErrors: Partial<Record<"birthDate" | "heightCm" | "weightKg", string[]>>;
  formError: string | null;
};

export function meta() {
  return [{ title: `${onboardingText.profile.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireOnboardingSession(request, "/perfil");

  const currentProfile = await getProfile(session.user.id);

  if (!currentProfile) {
    return redirect("/onboarding");
  }

  return {
    birthDate: currentProfile.birthDate ?? "",
    heightCm: currentProfile.heightCm ?? "",
    weightKg: currentProfile.weightKg ?? "",
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireOnboardingSession(request, "/perfil");

  const currentProfile = await getProfile(session.user.id);

  if (!currentProfile) {
    return redirect("/onboarding");
  }

  const formData = await request.formData();
  const parsed = profileDetailsSchema.safeParse({
    birthDate: formData.get("birthDate"),
    heightCm: formData.get("heightCm"),
    weightKg: formData.get("weightKg"),
  });

  if (!parsed.success) {
    const payload: ActionData = {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      formError: null,
    };

    return data(payload, { status: 400 });
  }

  const age = calculateAge(parsed.data.birthDate);

  if (age === null || age < 0) {
    const payload: ActionData = {
      fieldErrors: { birthDate: [onboardingText.errors.birthDateInvalid] },
      formError: null,
    };

    return data(payload, { status: 400 });
  }

  if (age < ADULT_AGE) {
    const payload: ActionData = {
      fieldErrors: {},
      formError: onboardingText.errors.underage,
    };

    return data(payload, { status: 400 });
  }

  await saveProfileDetails({
    userId: session.user.id,
    birthDate: parsed.data.birthDate,
    heightCm: parsed.data.heightCm,
    weightKg: parsed.data.weightKg ?? null,
  });

  return redirect("/salud");
}

export default function ProfileDetails() {
  const { birthDate, heightCm, weightKg } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.fieldErrors;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{onboardingText.profile.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {onboardingText.profile.subtitle}
        </p>
      </div>

      <Form method="post" className="space-y-5" noValidate>
        <FormError message={actionData?.formError} />

        <div className="space-y-2">
          <label htmlFor="birthDate" className="text-sm font-medium">
            {onboardingText.profile.birthDateLabel}
          </label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            max={today}
            defaultValue={birthDate}
            required
            aria-invalid={Boolean(errors?.birthDate)}
            aria-describedby={errors?.birthDate ? "birthDate-error" : "birthDate-help"}
          />
          {errors?.birthDate?.[0] ? (
            <FieldError id="birthDate-error" message={errors.birthDate[0]} />
          ) : (
            <p id="birthDate-help" className="text-xs text-muted-foreground">
              {onboardingText.profile.birthDateHelp}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="heightCm" className="text-sm font-medium">
            {onboardingText.profile.heightLabel}
          </label>
          <Input
            id="heightCm"
            name="heightCm"
            type="number"
            inputMode="numeric"
            min={120}
            max={250}
            defaultValue={heightCm}
            placeholder={onboardingText.profile.heightPlaceholder}
            required
            aria-invalid={Boolean(errors?.heightCm)}
            aria-describedby={errors?.heightCm ? "heightCm-error" : undefined}
          />
          <FieldError id="heightCm-error" message={errors?.heightCm?.[0]} />
        </div>

        <div className="space-y-2">
          <label htmlFor="weightKg" className="text-sm font-medium">
            {onboardingText.profile.weightLabel}
          </label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            inputMode="decimal"
            min={30}
            max={300}
            step="0.1"
            defaultValue={weightKg}
            placeholder={onboardingText.profile.weightPlaceholder}
            aria-invalid={Boolean(errors?.weightKg)}
            aria-describedby={errors?.weightKg ? "weightKg-error" : undefined}
          />
          <FieldError id="weightKg-error" message={errors?.weightKg?.[0]} />
        </div>

        <div className="space-y-3">
          <Button type="submit" size="lg" className="w-full">
            {onboardingText.profile.submit}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {onboardingText.profile.ageNote}
          </p>
        </div>
      </Form>
    </main>
  );
}
