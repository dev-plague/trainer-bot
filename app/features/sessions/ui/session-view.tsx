import { Form, Link, redirect, useLoaderData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { consentText } from "~/content/consent";
import { plansText, prescriptionText } from "~/content/plans";
import { sessionsText } from "~/content/sessions";
import { requireReadyUser } from "~/features/onboarding";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { ExerciseTypeBadge, MuscleBadges } from "~/shared/ui/exercise-meta";
import { AlertIcon, SuccessIcon } from "~/shared/ui/icons";
import { Progress } from "~/shared/ui/progress";
import { applyRegression, completeCurrentExercise } from "../data/session-actions";
import { getSessionState } from "../data/session-state";
import type { Route } from "./+types/session-view";

const idSchema = z.uuid();

export function meta() {
  return [{ title: `Sesión · ${common.appName}` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { session } = await requireReadyUser(request, `/sesion/${params.id}`);
  const parsed = idSchema.safeParse(params.id);

  if (!parsed.success) {
    throw new Response("No encontrado", { status: 404 });
  }

  const state = await getSessionState(session.user.id, parsed.data);

  if (!state) {
    throw new Response("No encontrado", { status: 404 });
  }

  return state;
}

export async function action({ request, params }: Route.ActionArgs) {
  const { session } = await requireReadyUser(request, `/sesion/${params.id}`);
  const parsed = idSchema.safeParse(params.id);

  if (!parsed.success) {
    throw new Response("No encontrado", { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "done") {
    await completeCurrentExercise(session.user.id, parsed.data);
  }

  if (intent === "regression") {
    await applyRegression(session.user.id, parsed.data);
  }

  return redirect(`/sesion/${parsed.data}`);
}

export default function SessionView() {
  const state = useLoaderData<typeof loader>();
  const { currentIndex } = state;

  if (state.status === "completed" || currentIndex === null) {
    return <SessionSummary doneCount={state.doneCount} durationMinutes={state.durationMinutes} />;
  }

  const current = state.exercises[currentIndex];

  if (!current) {
    return <SessionSummary doneCount={state.doneCount} durationMinutes={state.durationMinutes} />;
  }

  const isLast = state.doneCount + 1 === state.total;
  const progress = state.total > 0 ? Math.round((state.doneCount / state.total) * 100) : 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="sticky top-0 z-20 space-y-3 border-b bg-background/90 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <Link
            to="/plan"
            className="min-h-11 rounded-lg px-2 py-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            {sessionsText.leave}
          </Link>
          <span className="text-muted-foreground">
            {sessionsText.progress(currentIndex + 1, state.total)}
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2 transition-all duration-500"
          aria-label={sessionsText.progress(currentIndex + 1, state.total)}
        />
      </header>

      <main id="contenido" className="flex-1 space-y-5 px-4 py-6 pb-32">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {sessionsText.dayLabel} {state.dayIndex + 1}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{current.name}</h1>
          <p className="text-sm text-muted-foreground">{prescriptionText(current.prescription)}</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ExerciseTypeBadge kind={current.prescription.kind} />
              <Badge variant="outline">{plansText.categories[state.category]}</Badge>
            </div>
            <MuscleBadges muscles={current.primaryMuscles} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{sessionsText.tips}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {current.tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {current.isComplex && current.regression ? (
          <Card className="border-primary/25 bg-primary/5">
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {sessionsText.regressionHint(current.regression.name)}
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="regression" />
                <Button type="submit" variant="outline" className="w-full">
                  {sessionsText.regression}
                </Button>
              </Form>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-warning/35 bg-warning/5">
          <CardContent className="flex gap-3">
            <AlertIcon size={20} className="mt-0.5 shrink-0 text-warning" />
            <div className="space-y-1">
              <h2 className="text-xs font-semibold tracking-[0.1em] uppercase">
                {sessionsText.safetyTitle}
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {consentText.safety.body}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <div className="mx-auto max-w-md">
          <Form method="post">
            <input type="hidden" name="intent" value="done" />
            <Button type="submit" size="lg" className="w-full">
              {isLast ? sessionsText.finish : sessionsText.done}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}

function SessionSummary({
  doneCount,
  durationMinutes,
}: {
  doneCount: number;
  durationMinutes: number | null;
}) {
  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12"
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
        <SuccessIcon size={30} />
      </span>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{sessionsText.summaryTitle}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {sessionsText.summaryBody(doneCount, durationMinutes ?? 0)}
        </p>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{consentText.safety.body}</p>

      <Button asChild size="lg" className="w-full">
        <Link to="/plan">{sessionsText.backToPlan}</Link>
      </Button>
    </main>
  );
}
