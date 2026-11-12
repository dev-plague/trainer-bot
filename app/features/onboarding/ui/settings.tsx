import { data, Form, Link, useActionData, useLoaderData } from "react-router";
import { z } from "zod";

import { common } from "~/content/common";
import { onboardingText } from "~/content/onboarding";
import { settingsText } from "~/content/settings";
import { Button } from "~/shared/ui/button";
import { requireCompleteProfile } from "../data/guards";
import { saveProfile } from "../data/profile";
import { profileSetupSchema } from "../domain/profile";
import type { Route } from "./+types/settings";
import { PreferredNameFields } from "./preferred-name-fields";

type ActionData = {
  fieldErrors: Record<string, string[] | undefined>;
  saved: boolean;
};

export function meta() {
  return [{ title: `${settingsText.title} · ${common.appName}` }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireCompleteProfile(request, "/ajustes");

  return {
    preferredName: profile.preferredName,
    addressForm: profile.addressForm,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { session } = await requireCompleteProfile(request, "/ajustes");
  const formData = await request.formData();
  const parsed = profileSetupSchema.safeParse({
    preferredName: formData.get("preferredName"),
    addressForm: formData.get("addressForm") ?? undefined,
  });

  if (!parsed.success) {
    const payload: ActionData = {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      saved: false,
    };

    return data(payload, { status: 400 });
  }

  await saveProfile({ userId: session.user.id, ...parsed.data });

  const payload: ActionData = { fieldErrors: {}, saved: true };

  return data(payload);
}

export default function Settings() {
  const { preferredName, addressForm } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{settingsText.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{settingsText.subtitle}</p>
      </div>

      <Form method="post" className="space-y-6" noValidate>
        <PreferredNameFields
          defaultName={preferredName}
          defaultAddressForm={addressForm}
          errors={actionData?.fieldErrors}
        />

        {actionData?.saved ? (
          <p
            role="status"
            className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary"
          >
            {settingsText.saved}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full">
          {settingsText.submit}
        </Button>
      </Form>

      <nav className="flex flex-col gap-2 text-sm">
        <Link to="/perfil" className="font-medium text-primary underline-offset-4 hover:underline">
          {settingsText.profileLink}
        </Link>
        <Link to="/cuenta" className="font-medium text-primary underline-offset-4 hover:underline">
          {settingsText.accountLink}
        </Link>
      </nav>

      <p className="text-center text-xs text-muted-foreground">
        {onboardingText.preferredName.addressHelp}
      </p>
    </main>
  );
}
