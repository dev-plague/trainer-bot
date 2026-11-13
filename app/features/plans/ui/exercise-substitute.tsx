import { useEffect } from "react";
import { redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { equipmentLabel, exercisesText } from "~/content/exercises";
import { plansText } from "~/content/plans";
import { requireReadyUser } from "~/features/onboarding";
import { Badge } from "~/shared/ui/badge";
import { DumbbellIcon, TimerIcon } from "~/shared/ui/icons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/shared/ui/sheet";
import { getSubstitutionView, substitutePlanExercise } from "../data/substitution";
import type { Route } from "./+types/exercise-substitute";

const idSchema = z.uuid();
const substitutionSchema = z.object({ slug: z.string().min(1) });

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
    return { ok: false as const };
  }

  const formData = await request.formData();
  const parsed = substitutionSchema.safeParse({ slug: formData.get("slug") });

  if (!parsed.success) {
    return { ok: false as const };
  }

  const view = await getSubstitutionView(session.user.id, parsedId.data);
  const option = view?.options.find((item) => item.slug === parsed.data.slug);

  if (!option) {
    return { ok: false as const };
  }

  const changed = await substitutePlanExercise(session.user.id, parsedId.data, option.slug);

  if (!changed) {
    return { ok: false as const };
  }

  return { ok: true as const, name: option.name };
}

/**
 * Solo el drawer, abierto sobre la pantalla del plan. La ruta vive dentro de
 * `/plan`, así que el plan sigue detrás y el cierre devuelve ahí.
 */
export default function ExerciseSubstitute() {
  const view = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const submitting = fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.ok) {
      toast.success(plansText.changeConfirmed(fetcher.data.name));
      navigate("/plan", { replace: true });
      return;
    }

    toast.error(plansText.changeError);
  }, [fetcher.data, navigate]);

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) navigate("/plan");
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)] sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="border-b pr-14">
          <SheetTitle>{plansText.substituteTitle}</SheetTitle>
          <SheetDescription>{plansText.substituteSubtitle}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">{plansText.currentLabel}</p>
            <p className="font-medium">{view.current.name}</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">{plansText.optionsLabel}</h2>

            {view.options.length === 0 ? (
              <p className="text-sm text-muted-foreground">{plansText.noOptions}</p>
            ) : (
              <ul className="space-y-2">
                {view.options.map((option) => (
                  <li key={option.slug}>
                    <fetcher.Form method="post">
                      <input type="hidden" name="slug" value={option.slug} />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex min-h-16 w-full items-start justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
                      >
                        <span className="min-w-0 space-y-1.5">
                          <span className="block text-sm font-medium">{option.name}</span>
                          <span className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline">{exercisesText.levels[option.level]}</Badge>
                            {option.measure === "seconds" ? (
                              <Badge variant="secondary" className="gap-1">
                                <TimerIcon size={12} />
                                {plansText.timedOption}
                              </Badge>
                            ) : null}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <DumbbellIcon size={14} className="shrink-0" />
                            {option.equipment.length > 0
                              ? option.equipment.map((item) => equipmentLabel(item)).join(", ")
                              : exercisesText.noEquipment}
                          </span>
                        </span>
                        <span className="mt-1 text-xs font-medium text-muted-foreground">
                          {submitting ? plansText.changing : plansText.apply}
                        </span>
                      </button>
                    </fetcher.Form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
