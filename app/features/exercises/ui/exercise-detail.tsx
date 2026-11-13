import { Link, redirect, useLoaderData } from "react-router";

import { common } from "~/content/common";
import { equipmentLabel, exercisesText, muscleLabel } from "~/content/exercises";
import { getCurrentSession } from "~/features/auth";
import { exerciseSlugSchema } from "~/features/exercises";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { ExerciseTypeBadge, MuscleBadges } from "~/shared/ui/exercise-meta";
import { AlertIcon, ArrowRightIcon } from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
import { getExerciseBySlug } from "../data/exercises";
import type { Route } from "./+types/exercise-detail";

export function meta() {
  return [{ title: `Ejercicio · ${common.appName}` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getCurrentSession(request);

  if (!session) {
    return redirect(`/entrar?redirectTo=${encodeURIComponent(`/ejercicios/${params.slug}`)}`);
  }

  const parsed = exerciseSlugSchema.safeParse(params.slug);

  if (!parsed.success) {
    throw new Response("No encontrado", { status: 404 });
  }

  const detail = await getExerciseBySlug(parsed.data);

  if (!detail) {
    throw new Response("No encontrado", { status: 404 });
  }

  return detail;
}

export default function ExerciseDetail() {
  const exercise = useLoaderData<typeof loader>();
  const kind =
    exercise.equivalenceGroup === "mobility"
      ? "mobility"
      : exercise.measure === "seconds"
        ? "isometric"
        : "strength";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/plan">← {exercisesText.back}</Link>
      </Button>

      <PageHeader eyebrow={common.appName} title={exercise.name}>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{exercisesText.places[exercise.place]}</Badge>
          <Badge variant="outline">{exercisesText.levels[exercise.level]}</Badge>
          <ExerciseTypeBadge kind={kind} />
          {exercise.mobilityPhase ? (
            <Badge variant="secondary">
              {exercisesText.mobilityPhases[exercise.mobilityPhase]}
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{exercisesText.muscles}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MuscleBadges muscles={exercise.primaryMuscles} max={10} />
          {exercise.secondaryMuscles.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {exercisesText.secondaryMuscles}:{" "}
              {exercise.secondaryMuscles.map(muscleLabel).join(", ")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{exercisesText.equipment}</CardTitle>
        </CardHeader>
        <CardContent>
          {exercise.equipment.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {exercise.equipment.map((item) => (
                <Badge key={item} variant="secondary">
                  {equipmentLabel(item)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{exercisesText.noEquipment}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{exercisesText.tips}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {exercise.tips.map((tip) => (
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

      {exercise.contraindications.length > 0 ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertIcon size={18} className="text-warning" />
              {exercisesText.contraindications}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {exercise.contraindications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {exercise.regression ? (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{exercisesText.regression}</p>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link to={`/ejercicios/${exercise.regression.slug}`}>
                {exercise.regression.name}
                <ArrowRightIcon size={16} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <footer className="border-t pt-4 text-xs text-muted-foreground">
        {exercisesText.source}:{" "}
        {exercise.sourceUrl ? (
          <a href={exercise.sourceUrl} className="underline underline-offset-4" rel="noreferrer">
            {exercise.source}
          </a>
        ) : (
          exercise.source
        )}
      </footer>
    </div>
  );
}
