import { Link, redirect, useLoaderData } from "react-router";

import { common } from "~/content/common";
import { equipmentLabel, exercisesText, muscleLabel } from "~/content/exercises";
import { getCurrentSession } from "~/features/auth";
import { exerciseSlugSchema, getExerciseBySlug } from "~/features/exercises";
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

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-6 py-10">
      <Link
        to="/cuenta"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        ← {exercisesText.back}
      </Link>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
            {exercisesText.places[exercise.place]}
          </span>
          <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
            {exercisesText.levels[exercise.level]}
          </span>
        </div>
      </header>

      <section className="space-y-1">
        <h2 className="text-sm font-semibold">{exercisesText.muscles}</h2>
        <p className="text-sm text-muted-foreground">
          {exercise.primaryMuscles.map(muscleLabel).join(", ")}
        </p>
        {exercise.secondaryMuscles.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {exercisesText.secondaryMuscles}:{" "}
            {exercise.secondaryMuscles.map(muscleLabel).join(", ")}
          </p>
        ) : null}
      </section>

      <section className="space-y-1">
        <h2 className="text-sm font-semibold">{exercisesText.equipment}</h2>
        <p className="text-sm text-muted-foreground">
          {exercise.equipment.length > 0
            ? exercise.equipment.map(equipmentLabel).join(", ")
            : exercisesText.noEquipment}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{exercisesText.tips}</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {exercise.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      {exercise.contraindications.length > 0 ? (
        <section className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="text-sm font-semibold text-destructive">
            {exercisesText.contraindications}
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-destructive/90">
            {exercise.contraindications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {exercise.regression ? (
        <section className="space-y-2 rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">{exercisesText.regression}</p>
          <Link
            to={`/ejercicios/${exercise.regression.slug}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {exercise.regression.name}
          </Link>
        </section>
      ) : null}

      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        {exercisesText.source}:{" "}
        {exercise.sourceUrl ? (
          <a href={exercise.sourceUrl} className="underline underline-offset-4" rel="noreferrer">
            {exercise.source}
          </a>
        ) : (
          exercise.source
        )}
      </footer>
    </main>
  );
}
