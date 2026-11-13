import { Form, Link, redirect, useLoaderData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { consentText } from "~/content/consent";
import { prescriptionText } from "~/content/plans";
import { sessionsText } from "~/content/sessions";
import { requireReadyUser } from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
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

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          {sessionsText.progress(currentIndex + 1, state.total)}
        </p>
        <Link to="/plan" className="font-medium text-primary underline-offset-4 hover:underline">
          {sessionsText.leave}
        </Link>
      </div>

      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {sessionsText.dayLabel} {state.dayIndex + 1}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{current.name}</h1>
        <p className="text-sm text-muted-foreground">{prescriptionText(current.prescription)}</p>
      </header>

      <section className="space-y-1">
        <h2 className="text-sm font-semibold">{sessionsText.muscles}</h2>
        <p className="text-sm text-muted-foreground">{current.primaryMuscles.join(", ")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{sessionsText.tips}</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {current.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      {current.isComplex && current.regression ? (
        <section className="space-y-2 rounded-lg border border-border p-4">
          <Form method="post">
            <input type="hidden" name="intent" value="regression" />
            <Button type="submit" variant="outline" className="w-full">
              {sessionsText.regression}
            </Button>
          </Form>
          <p className="text-xs text-muted-foreground">
            {sessionsText.regressionHint(current.regression.name)}
          </p>
        </section>
      ) : null}

      <section className="space-y-1 rounded-lg border border-border bg-muted/40 p-4">
        <h2 className="text-xs font-semibold tracking-[0.1em] uppercase">
          {sessionsText.safetyTitle}
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{consentText.safety.body}</p>
      </section>

      <Form method="post">
        <input type="hidden" name="intent" value="done" />
        <Button type="submit" size="lg" className="w-full">
          {isLast ? sessionsText.finish : sessionsText.done}
        </Button>
      </Form>
    </main>
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
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
