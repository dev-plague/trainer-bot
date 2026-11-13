import { data, Form, redirect, useActionData, useNavigation } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { equipmentLabel } from "~/content/exercises";
import { plansText } from "~/content/plans";
import { EQUIPMENT } from "~/features/exercises/domain/equipment";
import { requireReadyUser } from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/shared/ui/field";
import { FormError } from "~/shared/ui/form";
import { PageHeader } from "~/shared/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/shared/ui/select";
import { Skeleton } from "~/shared/ui/skeleton";
import { generatePlanForUser } from "../data/generate-service";
import { planRequestSchema } from "../domain/contract";
import type { Route } from "./+types/plan-form";

type ActionData = {
  fieldErrors: Record<string, string[] | undefined>;
  formError: string | null;
};

export function meta() {
  return [{ title: `${plansText.formTitle} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireReadyUser(request, "/plan/nuevo");

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const { session } = await requireReadyUser(request, "/plan/nuevo");
  const formData = await request.formData();
  const parsed = planRequestSchema.safeParse({
    goal: formData.get("goal"),
    level: formData.get("level"),
    daysPerWeek: Number(formData.get("daysPerWeek")),
    sessionMinutes: Number(formData.get("sessionMinutes")),
    place: formData.get("place"),
    equipment: formData.getAll("equipment"),
    limitations: String(formData.get("limitations") ?? ""),
    mode: formData.get("mode"),
  });

  if (!parsed.success) {
    const payload: ActionData = {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      formError: plansText.formError,
    };

    return data(payload, { status: 400 });
  }

  await generatePlanForUser(session.user.id, parsed.data);

  return redirect("/plan");
}

export default function PlanForm() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.fieldErrors;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={common.appName}
        title={plansText.formTitle}
        description={plansText.formSubtitle}
      />

      <Form method="post" className="space-y-4" noValidate>
        <FormError message={actionData?.formError} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{plansText.fields.goal}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field>
              <FieldLabel htmlFor="goal" className="sr-only">
                {plansText.fields.goal}
              </FieldLabel>
              <Select name="goal" defaultValue="general_health">
                <SelectTrigger id="goal" className="h-11 w-full">
                  <SelectValue placeholder={plansText.fields.goal} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(plansText.goals).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {plansText.goalNotes.fat_loss}
              </p>
              <FieldError>{errors?.goal?.[0]}</FieldError>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{plansText.fields.level}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="level" className="sr-only">
                  {plansText.fields.level}
                </FieldLabel>
                <Select name="level" defaultValue="beginner">
                  <SelectTrigger id="level" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(plansText.levels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="daysPerWeek">{plansText.fields.days}</FieldLabel>
                <Select name="daysPerWeek" defaultValue="3">
                  <SelectTrigger id="daysPerWeek" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="sessionMinutes">{plansText.fields.minutes}</FieldLabel>
                <Select name="sessionMinutes" defaultValue="45">
                  <SelectTrigger id="sessionMinutes" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[20, 30, 45, 60, 90].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{plansText.fields.place}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="place" className="sr-only">
                {plansText.fields.place}
              </FieldLabel>
              <Select name="place" defaultValue="home">
                <SelectTrigger id="place" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(plansText.places).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>{plansText.fields.equipment}</FieldLabel>
              <p className="text-xs text-muted-foreground">{plansText.equipmentHelp}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {EQUIPMENT.map((item) => (
                  <label
                    key={item}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      name="equipment"
                      value={item}
                      className="size-4 accent-primary"
                    />
                    {equipmentLabel(item)}
                  </label>
                ))}
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{plansText.fields.mode}</CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel className="sr-only">{plansText.fields.mode}</FieldLabel>
              <div className="grid gap-2">
                {Object.entries(plansText.modes).map(([value, label], index) => (
                  <label
                    key={value}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={value}
                      defaultChecked={index === 0}
                      className="size-4 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{plansText.limitationsLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="limitations" className="sr-only">
                {plansText.limitationsLabel}
              </FieldLabel>
              <textarea
                id="limitations"
                name="limitations"
                rows={3}
                maxLength={300}
                placeholder={plansText.limitationsPlaceholder}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {plansText.limitationsHelp}
              </p>
            </Field>
          </CardContent>
        </Card>

        {isSubmitting ? (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? plansText.generating : plansText.submit}
        </Button>
      </Form>
    </div>
  );
}
