import { useCallback, useEffect, useReducer, useState } from "react";
import { Form, Link, redirect, useFetcher, useLoaderData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { consentText } from "~/content/consent";
import { exercisesText } from "~/content/exercises";
import { plansText, prescriptionText } from "~/content/plans";
import { sessionsText } from "~/content/sessions";
import { requireReadyUser } from "~/features/onboarding";
import { estimatePrescriptionMinutes } from "~/features/plans";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { ExerciseTypeBadge, MuscleBadges } from "~/shared/ui/exercise-meta";
import { AlertIcon, SuccessIcon } from "~/shared/ui/icons";
import { Progress } from "~/shared/ui/progress";
import { applyRegression, completeSet, skipCurrentExercise } from "../data/session-actions";
import { getSessionState } from "../data/session-state";
import {
  formatClock,
  type RestTimer,
  restElapsedRatio,
  restRemainingSeconds,
  sessionProgress,
  setProgress,
  startRestTimer,
  totalSetsFor,
} from "../domain/session-progress";
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

  if (intent === "set") {
    return completeSet(session.user.id, parsed.data);
  }

  if (intent === "regression") {
    await applyRegression(session.user.id, parsed.data);

    return redirect(`/sesion/${parsed.data}`);
  }

  if (intent === "skip") {
    return skipCurrentExercise(session.user.id, parsed.data);
  }

  return { ok: false as const };
}

export default function SessionView() {
  const state = useLoaderData<typeof loader>();
  const { currentIndex } = state;
  const fetcher = useFetcher<typeof action>();
  const [rest, setRest] = useState<RestTimer | null>(null);
  const clearRest = useCallback(() => setRest(null), []);

  useEffect(() => {
    const result = fetcher.data;

    if (result?.ok && result.restSeconds > 0 && !result.sessionDone) {
      setRest(startRestTimer(Date.now(), result.restSeconds));
    }
  }, [fetcher.data]);

  if (state.status === "completed" || currentIndex === null) {
    return <SessionSummary doneCount={state.doneCount} durationMinutes={state.durationMinutes} />;
  }

  const current = state.exercises[currentIndex];

  if (!current) {
    return <SessionSummary doneCount={state.doneCount} durationMinutes={state.durationMinutes} />;
  }

  const isCardio = current.prescription.kind === "cardio";
  const isIsometric = current.prescription.kind === "isometric";
  const isMobility = current.prescription.kind === "mobility";
  const mobilityMinutes = current.mobilityPhase
    ? Math.round(
        state.exercises
          .filter((exercise) => exercise.mobilityPhase === current.mobilityPhase)
          .reduce(
            (total, exercise) => total + estimatePrescriptionMinutes(exercise.prescription),
            0,
          ),
      )
    : 0;
  const isLastExercise = state.doneCount + 1 === state.total;
  const totalSets = totalSetsFor(current.prescription);
  const currentSet = setProgress(current.setsDone, totalSets);
  const progress = sessionProgress(state.exercises, currentIndex);
  const submitting = fetcher.state !== "idle";

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
          value={progress.percent}
          aria-label={sessionsText.progress(currentIndex + 1, state.total)}
        />
        {rest ? <RestBanner rest={rest} onDone={clearRest} /> : null}
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
              {current.mobilityPhase ? (
                <Badge variant="secondary">
                  {sessionsText.mobilityBlock(
                    exercisesText.mobilityPhases[current.mobilityPhase],
                    mobilityMinutes,
                  )}
                </Badge>
              ) : null}
              <Badge variant="outline">{plansText.categories[state.category]}</Badge>
            </div>
            <MuscleBadges muscles={current.primaryMuscles} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isCardio
                ? plansText.types.cardio
                : sessionsText.setProgress(currentSet.currentSet, currentSet.totalSets)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCardio ? null : (
              <p className="text-sm text-muted-foreground">
                {sessionsText.setsCompleted(currentSet.setsDone, currentSet.totalSets)}
              </p>
            )}

            {isIsometric && current.prescription.kind === "isometric" ? (
              <HoldCountdown
                key={`${current.logId}-${current.setsDone}`}
                seconds={current.prescription.seconds.min}
              />
            ) : null}
          </CardContent>
        </Card>

        {isMobility && current.mobilityPhase ? (
          <Card className="border-primary/25 bg-primary/5">
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {sessionsText.mobilityRecommended[current.mobilityPhase]}
              </p>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="skip" />
                <Button type="submit" variant="outline" className="w-full" disabled={submitting}>
                  {sessionsText.skipMobility}
                </Button>
              </fetcher.Form>
            </CardContent>
          </Card>
        ) : null}

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

        <Card className="border-border bg-muted">
          <CardContent className="flex gap-3">
            <AlertIcon size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
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
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="set" />
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {isCardio
                ? isLastExercise
                  ? sessionsText.finish
                  : sessionsText.done
                : sessionsText.setDone}
            </Button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}

/**
 * Descanso basado en `endsAt`: si la pantalla se bloquea o la pestaña queda en
 * segundo plano, al volver el tiempo restante sigue siendo el correcto.
 */
function RestBanner({ rest, onDone }: { rest: RestTimer; onDone: () => void }) {
  const [, tick] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    const id = window.setInterval(tick, 500);

    return () => window.clearInterval(id);
  }, []);

  const now = Date.now();
  const remaining = restRemainingSeconds(rest, now);
  const ratio = restElapsedRatio(rest, now);

  useEffect(() => {
    if (remaining <= 0) onDone();
  }, [remaining, onDone]);

  return (
    <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{sessionsText.restTitle}</p>
        <p aria-hidden="true" className="text-2xl font-semibold tabular-nums">
          {formatClock(remaining)}
        </p>
      </div>
      <p role="status" className="sr-only">
        {sessionsText.restAnnounce(rest.durationSeconds)}
      </p>
      <Progress value={ratio * 100} aria-label={sessionsText.restTitle} />
      <Button type="button" variant="outline" className="w-full" onClick={onDone}>
        {sessionsText.skipRest}
      </Button>
    </div>
  );
}

/** Cuenta regresiva del isométrico; empieza cuando la persona lo pide. */
function HoldCountdown({ seconds }: { seconds: number }) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [, tick] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    if (endsAt === null) return;

    const id = window.setInterval(tick, 250);

    return () => window.clearInterval(id);
  }, [endsAt]);

  if (endsAt === null) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setEndsAt(Date.now() + seconds * 1000)}
      >
        {sessionsText.holdStart}
      </Button>
    );
  }

  const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  return (
    <div className="space-y-2 rounded-xl border bg-muted/50 p-4 text-center">
      <p className="text-xs font-semibold tracking-[0.1em] uppercase">{sessionsText.holdTitle}</p>
      <p aria-hidden="true" className="text-3xl font-semibold tabular-nums">
        {formatClock(remaining)}
      </p>
      <p role="status" className="text-xs leading-relaxed text-muted-foreground">
        {remaining > 0 ? sessionsText.holdBody(seconds) : sessionsText.holdDone}
      </p>
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
