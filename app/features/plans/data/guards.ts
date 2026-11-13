import { redirect } from "react-router";

import { getScreening, PARQ_VERSION, requireCompleteProfile } from "~/features/onboarding";

/** Sesión, consentimientos, perfil completo y cuestionario vigente. */
export async function requirePlanReady(request: Request, next: string) {
  const { session } = await requireCompleteProfile(request, next);
  const screening = await getScreening(session.user.id);

  if (!screening || screening.questionnaireVersion !== PARQ_VERSION) {
    throw redirect("/salud");
  }

  return session;
}
