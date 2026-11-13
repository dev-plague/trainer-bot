import { Form, Link, redirect, useLoaderData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { plansText } from "~/content/plans";
import { requireReadyUser } from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
import { getSubstitutionView, substitutePlanExercise } from "../data/substitution";
import type { Route } from "./+types/exercise-substitute";

const idSchema = z.uuid();
const substitutionSchema = z.object({ slug: z.string().min(1) });

export function meta() {
  return [{ title: `${plansText.substituteTitle} · ${common.appName}` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { session } = await requireReadyUser(request, `/plan/ejercicio/${params.planExerciseId}`);
  const parsed = idSchema.safeParse(params.planExerciseId);

  if (!parsed.success) {
    throw new Response("No encontrado", { status: 404 });
  }

  const view = await getSubstitutionView(session.user.id, parsed.data);

  if (!view) {
    throw new Response("No encontrado", { status: 404 });
  }

  if (view.mode !== "flexible") {
    return redirect("/plan");
  }

  return view;
}

export async function action({ request, params }: Route.ActionArgs) {
  const { session } = await requireReadyUser(request, `/plan/ejercicio/${params.planExerciseId}`);
  const parsedId = idSchema.safeParse(params.planExerciseId);

  if (!parsedId.success) {
    throw new Response("No encontrado", { status: 404 });
  }

  const formData = await request.formData();
  const parsed = substitutionSchema.safeParse({ slug: formData.get("slug") });

  if (!parsed.success) {
    return redirect("/plan");
  }

  await substitutePlanExercise(session.user.id, parsedId.data, parsed.data.slug);

  return redirect("/plan");
}

export default function ExerciseSubstitute() {
  const view = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto w-full max-w-md space-y-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{plansText.substituteTitle}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {plansText.substituteSubtitle}
        </p>
      </div>

      <section className="space-y-1 rounded-lg border border-border p-4">
        <p className="text-xs text-muted-foreground">{plansText.currentLabel}</p>
        <p className="font-medium">{view.current.name}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{plansText.optionsLabel}</h2>

        {view.options.length === 0 ? (
          <p className="text-sm text-muted-foreground">{plansText.noOptions}</p>
        ) : (
          <ul className="space-y-2">
            {view.options.map((option) => (
              <li key={option.slug}>
                <Form method="post">
                  <input type="hidden" name="slug" value={option.slug} />
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                    <span className="text-sm font-medium">{option.name}</span>
                    <Button type="submit" size="sm" variant="outline">
                      {plansText.apply}
                    </Button>
                  </div>
                </Form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button asChild variant="ghost" className="w-full">
        <Link to="/plan">{plansText.cancel}</Link>
      </Button>
    </main>
  );
}
