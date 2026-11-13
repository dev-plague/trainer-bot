import { data, Form, Link, redirect, useActionData, useLoaderData } from "react-router";

import { common } from "~/content/common";
import { healthText } from "~/content/health";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { FormError } from "~/shared/ui/form";
import { AlertIcon } from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
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
    return <Referral />;
  }

  return <ScreeningForm />;
}

function Referral() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-6 py-10">
      <PageHeader
        eyebrow={common.appName}
        title={healthText.result.title}
        description={healthText.result.body}
      />

      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex gap-3">
          <AlertIcon size={22} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-sm leading-relaxed text-muted-foreground">{healthText.result.saved}</p>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link to="/cuenta">{healthText.result.account}</Link>
      </Button>
    </div>
  );
}

function ScreeningForm() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-6 py-10">
      <PageHeader
        eyebrow={common.appName}
        title={healthText.title}
        description={healthText.subtitle}
      />

      <Form method="post" className="space-y-3" noValidate>
        <FormError message={actionData?.error} />

        {PARQ_QUESTION_IDS.map((id, index) => (
          <Card key={id}>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed font-medium">
                <span className="mr-1.5 text-muted-foreground">{index + 1}.</span>
                {healthText.questions[id]}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5">
                  <input
                    type="radio"
                    name={id}
                    value="yes"
                    required
                    className="size-4 accent-primary"
                  />
                  {healthText.yes}
                </label>
                <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5">
                  <input type="radio" name={id} value="no" className="size-4 accent-primary" />
                  {healthText.no}
                </label>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="space-y-3 pt-1">
          <Button type="submit" size="lg" className="w-full">
            {healthText.submit}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{healthText.sourceNote}</p>
        </div>
      </Form>
    </div>
  );
}
