import { Form, Link, redirect, useLoaderData, useNavigate } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { plansText } from "~/content/plans";
import { requireReadyUser } from "~/features/onboarding";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { ArrowRightIcon } from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/shared/ui/sheet";
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
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={common.appName}
        title={plansText.substituteTitle}
        description={plansText.substituteSubtitle}
      />

      <Card>
        <CardContent className="space-y-1">
          <p className="text-xs text-muted-foreground">{plansText.currentLabel}</p>
          <p className="font-medium">{view.current.name}</p>
        </CardContent>
      </Card>

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
          <SheetHeader className="border-b">
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
                      <Form method="post">
                        <input type="hidden" name="slug" value={option.slug} />
                        <button
                          type="submit"
                          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                        >
                          <span className="text-sm font-medium">{option.name}</span>
                          <ArrowRightIcon size={18} className="text-muted-foreground" />
                        </button>
                      </Form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button asChild variant="ghost" className="w-full">
              <Link to="/plan">{plansText.cancel}</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
