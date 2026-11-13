import { Link, redirect, useLoaderData } from "react-router";

import { bmiText } from "~/content/bmi";
import { common } from "~/content/common";
import { getScreening, isAdult, PARQ_VERSION, requireCompleteProfile } from "~/features/onboarding";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { AlertIcon, ArrowRightIcon, BmiIcon } from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
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

const BMI_MIN = 15;
const BMI_MAX = 40;

function position(value: number) {
  return Math.min(100, Math.max(0, ((value - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100));
}

export default function BmiScreen() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={common.appName} title={bmiText.title} description={bmiText.subtitle} />

      {data.hasWeight ? (
        <>
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{bmiText.valueLabel}</p>
                  <p className="text-5xl font-semibold tracking-tight tabular-nums">
                    {data.bmi.toFixed(1)}
                  </p>
                </div>
                <Badge variant={data.category === "normal" ? "secondary" : "outline"}>
                  {bmiText.categories[data.category]}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="relative h-2.5 rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 rounded-full bg-primary/20"
                    style={{
                      left: `${position(18.5)}%`,
                      width: `${position(24.9) - position(18.5)}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-sm"
                    style={{ left: `${position(data.bmi)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{data.range.minKg} kg</span>
                  <span>{data.range.maxKg} kg</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {bmiText.rangePrefix} {data.range.minKg}–{data.range.maxKg} {bmiText.rangeSuffix}
              </p>
            </CardContent>
          </Card>

          <Card
            className={
              data.goal ? "border-primary/25 bg-primary/5" : "border-success/30 bg-success/5"
            }
          >
            <CardContent className="flex gap-3">
              <BmiIcon size={22} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed">
                {data.goal
                  ? `${data.goal.direction === "lose" ? bmiText.goal.losePrefix : bmiText.goal.gainPrefix} ${data.goal.targetKg} ${data.goal.direction === "lose" ? bmiText.goal.loseSuffix : bmiText.goal.gainSuffix}`
                  : bmiText.goal.normal}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2">
              <p className="text-sm leading-relaxed text-muted-foreground">{bmiText.explanation}</p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <AlertIcon size={16} className="mt-0.5 shrink-0" />
                <p>{bmiText.limits}</p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-sm font-semibold">{bmiText.noWeight.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{bmiText.noWeight.body}</p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/perfil">{bmiText.noWeight.link}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Button asChild size="lg" className="w-full gap-2">
        <Link to="/plan">
          {bmiText.continue}
          <ArrowRightIcon size={18} />
        </Link>
      </Button>
    </div>
  );
}
