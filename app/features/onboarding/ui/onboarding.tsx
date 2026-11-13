import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { onboardingText } from "~/content/onboarding";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { PageHeader } from "~/shared/ui/page-header";
import { requireOnboardingSession } from "../data/guards";
import { getProfile, saveProfile } from "../data/profile";
import { profileSetupSchema } from "../domain/profile";
import type { Route } from "./+types/onboarding";
import { PreferredNameFields } from "./preferred-name-fields";

export function meta() {
  return [{ title: `${onboardingText.preferredName.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireOnboardingSession(request, "/onboarding");
  const currentProfile = await getProfile(session.user.id);

  if (currentProfile) {
    return redirect(currentProfile.birthDate ? "/cuenta" : "/perfil");
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireOnboardingSession(request, "/onboarding");
  const formData = await request.formData();
  const parsed = profileSetupSchema.safeParse({
    preferredName: formData.get("preferredName"),
    addressForm: formData.get("addressForm") ?? undefined,
  });

  if (!parsed.success) {
    return data({ fieldErrors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }

  await saveProfile({ userId: session.user.id, ...parsed.data });

  return redirect("/perfil");
}

export default function Onboarding() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.fieldErrors;

  return (
    <div className="mx-auto w-full max-w-md space-y-8 px-6 py-10">
      <PageHeader
        eyebrow={common.appName}
        title={onboardingText.preferredName.title}
        description={onboardingText.preferredName.subtitle}
      />

      <Card>
        <CardContent>
          <Form method="post" className="space-y-6" noValidate>
            <PreferredNameFields errors={errors} />

            <Button type="submit" size="lg" className="w-full">
              {onboardingText.preferredName.submit}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
