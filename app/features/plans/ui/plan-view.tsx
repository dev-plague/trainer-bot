import { Form, Link, Outlet, redirect, useLoaderData } from "react-router";

import { common } from "~/content/common";
import { exercisesText } from "~/content/exercises";
import { plansText, prescriptionDetailText, prescriptionText, warningText } from "~/content/plans";
import { sessionsText } from "~/content/sessions";
import { requireReadyUser } from "~/features/onboarding";
import { getCompletedDayIndices, getInProgressSessionForUser } from "~/features/sessions";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { MuscleBadges } from "~/shared/ui/exercise-meta";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  ExerciseTypeIcon,
  PlanIcon,
  SuccessIcon,
} from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/shared/ui/tabs";
import { getActivePlan } from "../data/active-plan";
import { sharedDayPrescription } from "../domain/day-summary";
import { estimatePrescriptionMinutes } from "../domain/generate";
import type { Route } from "./+types/plan-view";
import { RirHelp } from "./rir-help";

export function meta() {
  return [{ title: `${plansText.planTitle} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { session } = await requireReadyUser(request, "/plan");
  const activePlan = await getActivePlan(session.user.id);

  if (!activePlan) {
    return redirect("/plan/nuevo");
  }

  const [inProgress, completedDays] = await Promise.all([
    getInProgressSessionForUser(session.user.id),
    getCompletedDayIndices(session.user.id, activePlan.id),
  ]);

  return { plan: activePlan, inProgress, completedDays };
}

export default function PlanView() {
  const { plan, inProgress, completedDays } = useLoaderData<typeof loader>();
  const completed = new Set(completedDays);
  const nextDay = plan.days.find((day) => !completed.has(day.dayIndex));
  const featuredDay = inProgress
    ? plan.days.find((day) => day.dayIndex === inProgress.dayIndex)
    : nextDay;
  const featuredExercise =
    featuredDay?.exercises.find((exercise) => exercise.prescription.kind !== "mobility") ??
    featuredDay?.exercises[0];
  const weekComplete = !inProgress && !nextDay;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={common.appName}
        title={plansText.planTitle}
        description={plansText.planSubtitle}
      >
        <div className="flex flex-wrap gap-2">
          <Badge>{plansText.goals[plan.goal]}</Badge>
          <Badge variant="secondary">{plansText.modesShort[plan.mode]}</Badge>
          <Badge variant="outline">
            {plan.daysPerWeek} {plansText.meta.days.toLowerCase()}
          </Badge>
          <Badge variant="outline">
            {plan.sessionMinutes} {plansText.meta.minutes.toLowerCase()}
          </Badge>
        </div>
      </PageHeader>

      {featuredDay ? (
        <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-br from-accent via-card to-card shadow-sm">
          <CardContent className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                  {inProgress ? plansText.continueSession : plansText.nextSession}
                </p>
                <h2 className="text-xl font-semibold tracking-tight">
                  {plansText.dayLabel} {featuredDay.dayIndex + 1} ·{" "}
                  {plansText.categories[featuredDay.category]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {plansText.exercisesCount(featuredDay.exercises.length)}
                </p>
              </div>
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PlanIcon size={26} />
              </span>
            </div>

            {featuredExercise ? (
              <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-3">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <ExerciseTypeIcon kind={featuredExercise.prescription.kind} size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{featuredExercise.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {prescriptionText(featuredExercise.prescription)}
                  </p>
                </div>
              </div>
            ) : null}

            {inProgress ? (
              <Button asChild size="lg" className="w-full gap-2">
                <Link to={`/sesion/${inProgress.id}`}>
                  {sessionsText.continue}
                  <ArrowRightIcon size={18} />
                </Link>
              </Button>
            ) : (
              <Form method="post" action="/sesion/nueva">
                <input type="hidden" name="planDayId" value={featuredDay.id} />
                <Button type="submit" size="lg" className="w-full gap-2">
                  {plansText.startDay}
                  <ArrowRightIcon size={18} />
                </Button>
              </Form>
            )}
          </CardContent>
        </Card>
      ) : weekComplete ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <SuccessIcon size={24} />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {plansText.weekCompleteTitle}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {plansText.weekCompleteBody}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {plan.warnings.length > 0 ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex gap-3">
            <AlertIcon size={20} className="mt-0.5 shrink-0 text-warning" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">{plansText.warningsTitle}</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.warnings.map((warning) => (
                  <li key={`${warning.code}-${warning.detail ?? ""}`}>{warningText(warning)}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs
        defaultValue={`day-${featuredDay?.dayIndex ?? plan.days[0]?.dayIndex ?? 0}`}
        className="gap-4"
      >
        <TabsList
          className="grid h-auto w-full gap-1 rounded-xl bg-muted p-1"
          style={{ gridTemplateColumns: `repeat(${plan.days.length}, minmax(0, 1fr))` }}
        >
          {plan.days.map((day) => {
            const isCompleted = completed.has(day.dayIndex);

            return (
              <TabsTrigger
                key={day.dayIndex}
                value={`day-${day.dayIndex}`}
                aria-label={`${plansText.dayLabel} ${day.dayIndex + 1}${
                  isCompleted ? `, ${plansText.completed.toLowerCase()}` : ""
                }`}
                className="min-h-11 gap-1 px-1 text-xs"
              >
                {isCompleted ? (
                  <span aria-hidden="true" className="inline-flex text-success">
                    <CheckIcon size={14} />
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">{plansText.dayLabel}</span>
                {day.dayIndex + 1}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {plan.days.map((day) => {
          const isCompleted = completed.has(day.dayIndex);
          const shared = sharedDayPrescription(day.exercises.map((item) => item.prescription));
          const hasStrength = day.exercises.some((item) => item.prescription.kind === "strength");
          const mobilityMinutes = (phase: "warmup" | "cooldown") =>
            Math.round(
              day.exercises
                .filter((exercise) => exercise.mobilityPhase === phase)
                .reduce(
                  (total, exercise) => total + estimatePrescriptionMinutes(exercise.prescription),
                  0,
                ),
            );
          const warmupMinutes = mobilityMinutes("warmup");
          const cooldownMinutes = mobilityMinutes("cooldown");

          return (
            <TabsContent key={day.dayIndex} value={`day-${day.dayIndex}`} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h2 className="text-sm font-semibold">{plansText.categories[day.category]}</h2>
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckIcon size={12} />
                      {plansText.completed}
                    </Badge>
                  ) : null}
                  <Badge variant="outline">{plansText.exercisesCount(day.exercises.length)}</Badge>
                  {hasStrength ? <RirHelp /> : null}
                </div>
              </div>

              {warmupMinutes > 0 || cooldownMinutes > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {plansText.mobilitySummary(warmupMinutes, cooldownMinutes)}
                </p>
              ) : null}

              {shared ? (
                <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{plansText.sharedDayLabel}:</span>{" "}
                  {prescriptionText(shared)}
                </p>
              ) : null}

              {day.exercises.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {plansText.emptyDay}
                </p>
              ) : (
                <ul className="space-y-2">
                  {day.exercises.map((exercise) => {
                    const detail = prescriptionDetailText(exercise.prescription, shared);

                    return (
                      <li
                        key={exercise.slug}
                        className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                            <ExerciseTypeIcon kind={exercise.prescription.kind} size={20} />
                          </span>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/ejercicios/${exercise.slug}`}
                                className="truncate font-medium underline-offset-4 hover:underline"
                              >
                                {exercise.name}
                              </Link>
                              {exercise.mobilityPhase ? (
                                <Badge variant="secondary">
                                  {exercisesText.mobilityPhases[exercise.mobilityPhase]}
                                </Badge>
                              ) : null}
                            </div>
                            {detail ? (
                              <p className="text-sm text-muted-foreground">{detail}</p>
                            ) : null}
                            <MuscleBadges muscles={exercise.primaryMuscles} max={2} />
                          </div>
                        </div>

                        {plan.mode === "flexible" ? (
                          <div className="mt-3 flex justify-end">
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/plan/ejercicio/${exercise.planExerciseId}`}>
                                {plansText.change}
                              </Link>
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              {day.exercises.length === 0 || isCompleted ? null : inProgress?.dayIndex ===
                day.dayIndex ? (
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/sesion/${inProgress.id}`}>{sessionsText.continue}</Link>
                </Button>
              ) : (
                <Form method="post" action="/sesion/nueva">
                  <input type="hidden" name="planDayId" value={day.id} />
                  <Button type="submit" variant="outline" className="w-full">
                    {sessionsText.start}
                  </Button>
                </Form>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex flex-col gap-2">
        <Button asChild variant="ghost">
          <Link to="/plan/nuevo">{plansText.regenerate}</Link>
        </Button>
      </div>

      <Outlet />
    </div>
  );
}
