import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { consentText } from "~/content/consent";
import { requireUser } from "~/features/auth";
import { Button } from "~/shared/ui/button";
import { getAcceptedConsents, recordConsents } from "../data/consents";
import { CONSENT_KINDS, missingConsents } from "../domain/consents";
import type { Route } from "./+types/consent";

const consentFormSchema = z.object({
  safety_notice: z.literal(true),
  health_data: z.literal(true),
});

export function meta() {
  return [{ title: `${consentText.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireUser(request, "/consentimiento");

  const accepted = await getAcceptedConsents(session.user.id);

  if (missingConsents(accepted).length === 0) {
    return redirect("/onboarding");
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireUser(request, "/consentimiento");

  const formData = await request.formData();
  const parsed = consentFormSchema.safeParse({
    safety_notice: formData.get("safety_notice") === "on",
    health_data: formData.get("health_data") === "on",
  });

  if (!parsed.success) {
    return data({ error: consentText.errorBoth }, { status: 400 });
  }

  await recordConsents(session.user.id, CONSENT_KINDS);

  return redirect("/onboarding");
}

export default function Consent() {
  const actionData = useActionData<typeof action>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{consentText.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{consentText.subtitle}</p>
      </div>

      <Form method="post" className="space-y-6">
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">{consentText.safety.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{consentText.safety.body}</p>
          <label htmlFor="safety_notice" className="flex items-start gap-3 text-sm">
            <input
              id="safety_notice"
              name="safety_notice"
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>{consentText.safety.label}</span>
          </label>
        </section>

        <section className="space-y-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">{consentText.data.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{consentText.data.body}</p>
          <label htmlFor="health_data" className="flex items-start gap-3 text-sm">
            <input
              id="health_data"
              name="health_data"
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>{consentText.data.label}</span>
          </label>
        </section>

        {actionData?.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {actionData.error}
          </p>
        ) : null}

        <div className="space-y-3">
          <Button type="submit" size="lg" className="w-full">
            {consentText.submit}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{consentText.dateNote}</p>
        </div>
      </Form>
    </main>
  );
}
