import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { equipmentLabel } from "~/content/exercises";
import { plansText } from "~/content/plans";
import { EQUIPMENT } from "~/features/exercises/domain/equipment";
import { requireReadyUser } from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
import { FieldError, FormError } from "~/shared/ui/form";
import { Select } from "~/shared/ui/select";
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

  return (
    <main className="mx-auto w-full max-w-md space-y-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{plansText.formTitle}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{plansText.formSubtitle}</p>
      </div>

      <Form method="post" className="space-y-5" noValidate>
        <FormError message={actionData?.formError} />

        <div className="space-y-2">
          <label htmlFor="goal" className="text-sm font-medium">
            {plansText.fields.goal}
          </label>
          <Select id="goal" name="goal" defaultValue="general_health">
            {Object.entries(plansText.goals).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">{plansText.goalNotes.fat_loss}</p>
          <FieldError id="goal-error" message={actionData?.fieldErrors?.goal?.[0]} />
        </div>

        <div className="space-y-2">
          <label htmlFor="level" className="text-sm font-medium">
            {plansText.fields.level}
          </label>
          <Select id="level" name="level" defaultValue="beginner">
            {Object.entries(plansText.levels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <FieldError id="level-error" message={actionData?.fieldErrors?.level?.[0]} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="daysPerWeek" className="text-sm font-medium">
              {plansText.fields.days}
            </label>
            <Select id="daysPerWeek" name="daysPerWeek" defaultValue="3">
              {[2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="sessionMinutes" className="text-sm font-medium">
              {plansText.fields.minutes}
            </label>
            <Select id="sessionMinutes" name="sessionMinutes" defaultValue="45">
              {[20, 30, 45, 60, 90].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="place" className="text-sm font-medium">
            {plansText.fields.place}
          </label>
          <Select id="place" name="place" defaultValue="home">
            {Object.entries(plansText.places).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{plansText.fields.equipment}</legend>
          <p className="text-xs text-muted-foreground">{plansText.equipmentHelp}</p>
          <div className="grid gap-2">
            {EQUIPMENT.map((item) => (
              <label
                key={item}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5"
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
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{plansText.fields.mode}</legend>
          <div className="grid gap-2">
            {Object.entries(plansText.modes).map(([value, label], index) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5"
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
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="limitations" className="text-sm font-medium">
            {plansText.limitationsLabel}
          </label>
          <textarea
            id="limitations"
            name="limitations"
            rows={3}
            maxLength={300}
            placeholder={plansText.limitationsPlaceholder}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
          <p className="text-xs text-muted-foreground">{plansText.limitationsHelp}</p>
        </div>

        <Button type="submit" size="lg" className="w-full">
          {plansText.submit}
        </Button>
      </Form>
    </main>
  );
}
