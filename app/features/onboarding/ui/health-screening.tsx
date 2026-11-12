import { data, Form, Link, redirect, useActionData, useLoaderData } from "react-router";

import { common } from "~/content/common";
import { healthText } from "~/content/health";
import { Button } from "~/shared/ui/button";
import { FormError } from "~/shared/ui/form";
import { requireCompleteProfile } from "../data/guards";
import { getScreening, saveScreening } from "../data/health";
import {
  needsMedicalClearance,
  PARQ_QUESTION_IDS,
  PARQ_VERSION,
  parqFormSchema,
  toAnswers,
} from "../domain/parq";
import type { Route } from "./+types/health-screening";

type ActionData = { error: string };

export function meta() {
  return [{ title: `${healthText.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { session } = await requireCompleteProfile(request, "/salud");
  const screening = await getScreening(session.user.id);

  if (screening && screening.questionnaireVersion === PARQ_VERSION) {
    if (!screening.needsMedicalClearance) {
      return redirect("/imc");
    }

    return { mode: "result" as const };
  }

  return { mode: "form" as const };
}

export async function action({ request }: Route.ActionArgs) {
  const { session } = await requireCompleteProfile(request, "/salud");
  const formData = await request.formData();
  const parsed = parqFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return data({ error: healthText.errors.incomplete } satisfies ActionData, { status: 400 });
  }

  const answers = toAnswers(parsed.data);

  await saveScreening({
    userId: session.user.id,
    answers,
    version: PARQ_VERSION,
    needsMedicalClearance: needsMedicalClearance(answers),
  });

  return redirect("/salud");
}

export default function HealthScreening() {
  const result = useLoaderData<typeof loader>();

  if (result.mode === "result") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {common.appName}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{healthText.result.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{healthText.result.body}</p>
          <p className="text-xs text-muted-foreground">{healthText.result.saved}</p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link to="/cuenta">{healthText.result.account}</Link>
        </Button>
      </main>
    );
  }

  return <ScreeningForm />;
}

function ScreeningForm() {
  const actionData = useActionData<typeof action>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{healthText.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{healthText.subtitle}</p>
      </div>

      <Form method="post" className="space-y-4" noValidate>
        <FormError message={actionData?.error} />

        {PARQ_QUESTION_IDS.map((id, index) => (
          <fieldset key={id} className="space-y-2 rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-medium">
              {index + 1}. {healthText.questions[id]}
            </legend>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={id}
                  value="yes"
                  required
                  className="size-4 accent-primary"
                />
                {healthText.yes}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name={id} value="no" className="size-4 accent-primary" />
                {healthText.no}
              </label>
            </div>
          </fieldset>
        ))}

        <div className="space-y-3">
          <Button type="submit" size="lg" className="w-full">
            {healthText.submit}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{healthText.sourceNote}</p>
        </div>
      </Form>
    </main>
  );
}
