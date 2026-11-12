import { redirect } from "react-router";

import { getCurrentSession } from "~/features/auth";
import { missingConsents } from "../domain/consents";
import { getAcceptedConsents } from "./consents";
import { getProfile } from "./profile";

/**
 * Exige sesión y consentimientos vigentes. Lanza una redirección si falta algo.
 */
export async function requireOnboardingSession(request: Request, next: string) {
  const session = await getCurrentSession(request);

  if (!session) {
    throw redirect(`/entrar?redirectTo=${encodeURIComponent(next)}`);
  }

  const accepted = await getAcceptedConsents(session.user.id);

  if (missingConsents(accepted).length > 0) {
    throw redirect("/consentimiento");
  }

  return session;
}

/**
 * Además de la sesión, exige nombre preferido y datos de perfil completos.
 */
export async function requireCompleteProfile(request: Request, next: string) {
  const session = await requireOnboardingSession(request, next);
  const profile = await getProfile(session.user.id);

  if (!profile) {
    throw redirect("/onboarding");
  }

  if (!profile.birthDate) {
    throw redirect("/perfil");
  }

  return { session, profile };
}
