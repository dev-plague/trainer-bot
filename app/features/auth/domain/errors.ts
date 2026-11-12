/**
 * Better Auth lanza errores con la forma `{ body: { code } }`.
 * Esta función solo extrae el código, sin depender de su clase interna.
 */
export function authErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const body = (error as { body?: { code?: unknown } }).body;

  return typeof body?.code === "string" ? body.code : undefined;
}
