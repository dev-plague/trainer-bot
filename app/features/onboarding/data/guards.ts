import { redirect } from "react-router";

import { requireUser } from "~/features/auth";
import { missingConsents } from "../domain/consents";
import { PARQ_VERSION } from "../domain/parq";
import { getAcceptedConsents } from "./consents";
import { getScreening } from "./health";
import { getProfile } from "./profile";

/**
 * Exige sesión y consentimientos vigentes. Lanza una redirección si falta algo.
 */
export async function requireOnboardingSession(request: Request, next: string) {
  const session = await requireUser(request, next);

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

/**
 * Onboarding completo: sesión, consentimientos, perfil y cuestionario vigente.
 * Es la puerta para ver el plan y entrenar.
 */
export async function requireReadyUser(request: Request, next: string) {
  const result = await requireCompleteProfile(request, next);
  const screening = await getScreening(result.session.user.id);

  if (!screening || screening.questionnaireVersion !== PARQ_VERSION) {
    throw redirect("/salud");
  }

  return result;
}
