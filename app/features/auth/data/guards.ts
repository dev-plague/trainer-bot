import { redirect } from "react-router";

import { guestRedirectTarget, loginRedirectTarget } from "../domain/routing";
import { getCurrentSession } from "./session";

/**
 * Pantallas públicas de autenticación (landing, login, registro).
 * Con sesión se salta a la app antes de renderizar: sin parpadeo.
 */
export async function requireGuest(request: Request) {
  const session = await getCurrentSession(request);
  const target = guestRedirectTarget(session !== null);

  if (target) {
    throw redirect(target);
  }

  return null;
}

/**
 * Rutas protegidas. Si no hay sesión, manda a login conservando una ruta
 * interna; el destino pasa por `safeRedirectPath` (sin open redirect).
 */
export async function requireUser(request: Request, next: string) {
  const session = await getCurrentSession(request);

  if (!session) {
    throw redirect(loginRedirectTarget(next));
  }

  return session;
}
