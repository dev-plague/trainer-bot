import { Link, redirect, useLoaderData } from "react-router";

import { bmiText } from "~/content/bmi";
import { common } from "~/content/common";
import { getScreening, isAdult, PARQ_VERSION, requireCompleteProfile } from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
import { calculateBmi, classifyBmi, healthyWeightRange, intermediateGoal } from "../domain/bmi";
import type { Route } from "./+types/bmi-screen";

export function meta() {
  return [{ title: `${bmiText.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { session, profile } = await requireCompleteProfile(request, "/imc");

  const screening = await getScreening(session.user.id);

  if (!screening || screening.questionnaireVersion !== PARQ_VERSION) {
    return redirect("/salud");
  }

  if (!profile.birthDate || !isAdult(profile.birthDate)) {
    return redirect("/cuenta");
  }

  if (!profile.heightCm) {
    return redirect("/perfil");
  }

  if (!profile.weightKg) {
    return { hasWeight: false as const };
  }

  const weightKg = Number(profile.weightKg);
  const bmi = calculateBmi(weightKg, profile.heightCm);

  return {
    hasWeight: true as const,
    bmi,
    category: classifyBmi(bmi),
    range: healthyWeightRange(profile.heightCm),
    goal: intermediateGoal(weightKg, profile.heightCm),
    heightCm: profile.heightCm,
  };
}

export default function BmiScreen() {
  const data = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{bmiText.title}</h1>
        <p className="text-sm text-muted-foreground">{bmiText.subtitle}</p>
      </div>

      {data.hasWeight ? (
        <>
          <section className="space-y-1 rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{bmiText.valueLabel}</p>
            <p className="text-4xl font-semibold tracking-tight">{data.bmi.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">{bmiText.categories[data.category]}</p>
          </section>

          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{bmiText.explanation}</p>
            <p>
              {bmiText.rangePrefix} {data.range.minKg}–{data.range.maxKg} {bmiText.rangeSuffix}
            </p>
            <p className="text-foreground">
              {data.goal
                ? `${data.goal.direction === "lose" ? bmiText.goal.losePrefix : bmiText.goal.gainPrefix} ${data.goal.targetKg} ${data.goal.direction === "lose" ? bmiText.goal.loseSuffix : bmiText.goal.gainSuffix}`
                : bmiText.goal.normal}
            </p>
            <p className="text-xs">{bmiText.limits}</p>
          </div>
        </>
      ) : (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">{bmiText.noWeight.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{bmiText.noWeight.body}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/perfil">{bmiText.noWeight.link}</Link>
          </Button>
        </section>
      )}

      <Button asChild size="lg" className="w-full">
        <Link to="/cuenta">{bmiText.continue}</Link>
      </Button>
    </main>
  );
}
