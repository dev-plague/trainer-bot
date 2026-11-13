import { redirect } from "react-router";
import { z } from "zod";

import { requireReadyUser } from "~/features/onboarding";
import { startSessionForDay } from "../data/start-session";
import type { Route } from "./+types/session-start";

const startSchema = z.object({ planDayId: z.string().min(1) });

export async function loader() {
  return redirect("/plan");
}

export async function action({ request }: Route.ActionArgs) {
  const { session } = await requireReadyUser(request, "/plan");
  const formData = await request.formData();
  const parsed = startSchema.safeParse({ planDayId: formData.get("planDayId") });

  if (!parsed.success) {
    return redirect("/plan");
  }

  const sessionId = await startSessionForDay(session.user.id, parsed.data.planDayId);

  if (!sessionId) {
    return redirect("/plan");
  }

  return redirect(`/sesion/${sessionId}`);
}
