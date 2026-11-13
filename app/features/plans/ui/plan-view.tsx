import { Form, Link, redirect, useLoaderData } from "react-router";

import { common } from "~/content/common";
import { plansText, prescriptionText, warningText } from "~/content/plans";
import { sessionsText } from "~/content/sessions";
import { requireReadyUser } from "~/features/onboarding";
import { getInProgressSessionForUser } from "~/features/sessions";
import { Button } from "~/shared/ui/button";
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

  return (
    <main className="mx-auto w-full max-w-md space-y-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{plansText.planTitle}</h1>
        <p className="text-sm text-muted-foreground">{plansText.planSubtitle}</p>
      </div>

      {inProgress ? (
        <section className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold">{sessionsText.inProgressTitle}</h2>
          <p className="text-xs text-muted-foreground">{sessionsText.inProgressBody}</p>
          <Link
            to={`/sesion/${inProgress.id}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {sessionsText.continue} · {sessionsText.dayLabel} {inProgress.dayIndex + 1}
          </Link>
        </section>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border p-4 text-sm">
        <div>
          <dt className="text-muted-foreground">{plansText.meta.goal}</dt>
          <dd className="font-medium">{plansText.goals[plan.goal]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{plansText.meta.mode}</dt>
          <dd className="font-medium">{plansText.modesShort[plan.mode]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{plansText.meta.days}</dt>
          <dd className="font-medium">{plan.daysPerWeek}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{plansText.meta.minutes}</dt>
          <dd className="font-medium">{plan.sessionMinutes}</dd>
        </div>
      </dl>

      {plan.warnings.length > 0 ? (
        <section className="space-y-2 rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="text-sm font-semibold">{plansText.warningsTitle}</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {plan.warnings.map((warning) => (
              <li key={`${warning.code}-${warning.detail ?? ""}`}>{warningText(warning)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="space-y-6">
        {plan.days.map((day) => (
          <section key={day.dayIndex} className="space-y-3">
            <h2 className="text-sm font-semibold">
              {plansText.dayLabel} {day.dayIndex + 1} · {plansText.categories[day.category]}
            </h2>

            {day.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">{plansText.emptyDay}</p>
            ) : (
              <ul className="space-y-2">
                {day.exercises.map((exercise) => (
                  <li
                    key={exercise.slug}
                    className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <Link
                      to={`/ejercicios/${exercise.slug}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {exercise.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {prescriptionText(exercise.prescription)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {day.exercises.length > 0 ? (
              <Form method="post" action="/sesion/nueva">
                <input type="hidden" name="planDayId" value={day.id} />
                <Button type="submit" variant="secondary" size="sm">
                  {sessionsText.start}
                </Button>
              </Form>
            ) : null}
          </section>
        ))}
      </div>

      <Button asChild variant="outline" className="w-full">
        <Link to="/plan/nuevo">{plansText.regenerate}</Link>
      </Button>
    </main>
  );
}
