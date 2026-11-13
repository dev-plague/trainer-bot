import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { consentText } from "~/content/consent";
import { requireUser } from "~/features/auth";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { AccountIcon, AlertIcon, SuccessIcon } from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
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
    <div className="mx-auto w-full max-w-md space-y-8 px-6 py-10">
      <PageHeader
        eyebrow={common.appName}
        title={consentText.title}
        description={consentText.subtitle}
      />

      <Form method="post" className="space-y-4">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <AlertIcon size={20} />
              <h2 className="text-sm font-semibold">{consentText.safety.title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {consentText.safety.body}
            </p>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5">
              <input
                id="safety_notice"
                name="safety_notice"
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>{consentText.safety.label}</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <AccountIcon size={20} />
              <h2 className="text-sm font-semibold">{consentText.data.title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{consentText.data.body}</p>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/5">
              <input
                id="health_data"
                name="health_data"
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>{consentText.data.label}</span>
            </label>
          </CardContent>
        </Card>

        {actionData?.error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {actionData.error}
          </p>
        ) : null}

        <div className="space-y-3">
          <Button type="submit" size="lg" className="w-full gap-2">
            <SuccessIcon size={18} />
            {consentText.submit}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{consentText.dateNote}</p>
        </div>
      </Form>
    </div>
  );
}
