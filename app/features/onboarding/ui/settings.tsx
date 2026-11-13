import { useEffect } from "react";
import { data, Form, Link, useActionData, useLoaderData } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { common } from "~/content/common";
import { settingsText } from "~/content/settings";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { ArrowRightIcon, BmiIcon, PlanIcon } from "~/shared/ui/icons";
import { PageHeader } from "~/shared/ui/page-header";
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

  useEffect(() => {
    if (actionData?.saved) {
      toast.success(settingsText.savedToast);
    }
  }, [actionData?.saved]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={common.appName}
        title={settingsText.title}
        description={settingsText.subtitle}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{settingsText.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6" noValidate>
            <PreferredNameFields
              defaultName={preferredName}
              defaultAddressForm={addressForm}
              errors={actionData?.fieldErrors}
            />

            <Button type="submit" size="lg" className="w-full">
              {settingsText.submit}
            </Button>
          </Form>
        </CardContent>
      </Card>

      <nav aria-label="Accesos" className="grid gap-2 sm:grid-cols-2">
        <Link
          to="/perfil"
          className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted">
            <PlanIcon size={20} />
          </span>
          <span className="flex-1 text-sm font-medium">{settingsText.profileLink}</span>
          <ArrowRightIcon size={16} className="text-muted-foreground" />
        </Link>
        <Link
          to="/cuenta"
          className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted">
            <BmiIcon size={20} />
          </span>
          <span className="flex-1 text-sm font-medium">{settingsText.accountLink}</span>
          <ArrowRightIcon size={16} className="text-muted-foreground" />
        </Link>
      </nav>
    </div>
  );
}
