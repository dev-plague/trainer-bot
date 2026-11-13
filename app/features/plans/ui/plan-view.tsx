import { Form, Link, redirect, useLoaderData } from "react-router";

import { common } from "~/content/common";
import { plansText, prescriptionText, warningText } from "~/content/plans";
import { sessionsText } from "~/content/sessions";
import { requireReadyUser } from "~/features/onboarding";
import { getInProgressSessionForUser } from "~/features/sessions";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { MuscleBadges } from "~/shared/ui/exercise-meta";
import { AlertIcon, ArrowRightIcon, ExerciseTypeIcon, PlanIcon } from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/shared/ui/tabs";
import { getActivePlan } from "../data/active-plan";
import type { Route } from "./+types/plan-view";

export function meta() {
  return [{ title: `${plansText.planTitle} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { session } = await requireReadyUser(request, "/plan");
  const activePlan = await getActivePlan(session.user.id);

  if (!activePlan) {
    return redirect("/plan/nuevo");
  }

  const inProgress = await getInProgressSessionForUser(session.user.id);

  return { plan: activePlan, inProgress };
}

export default function PlanView() {
  const { plan, inProgress } = useLoaderData<typeof loader>();
  const featuredIndex = inProgress?.dayIndex ?? 0;
  const featuredDay = plan.days[featuredIndex] ?? plan.days[0];
  const featuredExercise = featuredDay?.exercises[0];

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
                  {inProgress ? plansText.continueSession : plansText.today}
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

      <Tabs defaultValue={`day-${featuredIndex}`} className="gap-4">
        <TabsList
          className="grid h-auto w-full gap-1 rounded-xl bg-muted p-1"
          style={{ gridTemplateColumns: `repeat(${plan.days.length}, minmax(0, 1fr))` }}
        >
          {plan.days.map((day) => (
            <TabsTrigger
              key={day.dayIndex}
              value={`day-${day.dayIndex}`}
              className="min-h-11 gap-1 px-1 text-xs"
            >
              <span className="text-xs text-muted-foreground">{plansText.dayLabel}</span>
              {day.dayIndex + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {plan.days.map((day) => (
          <TabsContent key={day.dayIndex} value={`day-${day.dayIndex}`} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{plansText.categories[day.category]}</h2>
              <Badge variant="outline">{plansText.exercisesCount(day.exercises.length)}</Badge>
            </div>

            {day.exercises.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                {plansText.emptyDay}
              </p>
            ) : (
              <ul className="space-y-2">
                {day.exercises.map((exercise) => (
                  <li
                    key={exercise.slug}
                    className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                        <ExerciseTypeIcon kind={exercise.prescription.kind} size={20} />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Link
                          to={`/ejercicios/${exercise.slug}`}
                          className="block truncate font-medium underline-offset-4 hover:underline"
                        >
                          {exercise.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {prescriptionText(exercise.prescription)}
                        </p>
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
                ))}
              </ul>
            )}

            {day.exercises.length > 0 && inProgress?.dayIndex !== day.dayIndex ? (
              <Form method="post" action="/sesion/nueva">
                <input type="hidden" name="planDayId" value={day.id} />
                <Button type="submit" variant="outline" className="w-full">
                  {sessionsText.start}
                </Button>
              </Form>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-col gap-2">
        <Button asChild variant="ghost">
          <Link to="/plan/nuevo">{plansText.regenerate}</Link>
        </Button>
      </div>
    </div>
  );
}
