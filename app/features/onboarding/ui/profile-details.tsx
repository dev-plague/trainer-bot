import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { data, Form, redirect, useActionData, useLoaderData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { onboardingText } from "~/content/onboarding";
import { Button } from "~/shared/ui/button";
import { Calendar } from "~/shared/ui/calendar";
import { Card, CardContent } from "~/shared/ui/card";
import { Field, FieldError, FieldLabel } from "~/shared/ui/field";
import { FormError } from "~/shared/ui/form";
import { Input } from "~/shared/ui/input";
import { PageHeader } from "~/shared/ui/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "~/shared/ui/popover";
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
  const [selectedDate, setSelectedDate] = useState(birthDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = new Date();
  const date = selectedDate ? parseISO(selectedDate) : undefined;

  return (
    <div className="mx-auto w-full max-w-md space-y-8 px-6 py-10">
      <PageHeader
        eyebrow={common.appName}
        title={onboardingText.profile.title}
        description={onboardingText.profile.subtitle}
      />

      <Card>
        <CardContent>
          <Form method="post" className="space-y-5" noValidate>
            <FormError message={actionData?.formError} />

            <Field>
              <FieldLabel htmlFor="birthDate">{onboardingText.profile.birthDateLabel}</FieldLabel>
              <input type="hidden" name="birthDate" value={selectedDate} />
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="birthDate"
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-start font-normal"
                  >
                    {date
                      ? format(date, "PPP", { locale: es })
                      : onboardingText.profile.birthDatePlaceholder}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={es}
                    selected={date}
                    defaultMonth={date}
                    captionLayout="dropdown"
                    startMonth={new Date(1900, 0)}
                    endMonth={today}
                    disabled={{ after: today }}
                    labels={{
                      labelPrevious: () => "Mes anterior",
                      labelNext: () => "Mes siguiente",
                    }}
                    onSelect={(value) => {
                      if (value) {
                        setSelectedDate(format(value, "yyyy-MM-dd"));
                        setCalendarOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors?.birthDate?.[0] ? (
                <FieldError>{errors.birthDate[0]}</FieldError>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {onboardingText.profile.birthDateHelp}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="heightCm">{onboardingText.profile.heightLabel}</FieldLabel>
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
              />
              <FieldError>{errors?.heightCm?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="weightKg">{onboardingText.profile.weightLabel}</FieldLabel>
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
              />
              <FieldError>{errors?.weightKg?.[0]}</FieldError>
            </Field>

            <div className="space-y-3">
              <Button type="submit" size="lg" className="w-full">
                {onboardingText.profile.submit}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {onboardingText.profile.ageNote}
              </p>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
