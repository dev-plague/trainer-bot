import { safeRedirectPath } from "~/shared/lib/safe-redirect";

/** A dónde va alguien que ya tiene sesión y abre una pantalla de autenticación. */
export const AUTHENTICATED_HOME = "/plan";

export const LOGIN_PATH = "/entrar";

/** `null` significa «no redirigir»: no hay sesión. */
export function guestRedirectTarget(hasSession: boolean): string | null {
  return hasSession ? AUTHENTICATED_HOME : null;
}

/**
 * Destino de login conservando la ruta pedida, solo si es interna.
 * Una ruta externa cae al destino por defecto (`/cuenta`).
 */
export function loginRedirectTarget(next: string): string {
  const safeNext = safeRedirectPath(next, "/cuenta");

  return `${LOGIN_PATH}?redirectTo=${encodeURIComponent(safeNext)}`;
}
