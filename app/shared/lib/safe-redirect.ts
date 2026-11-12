/**
 * Evita redirecciones abiertas: solo acepta rutas internas absolutas.
 * `//evil.com` y `https://evil.com` se descartan.
 */
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || hasControlCharacters(value)) return fallback;

  return value;
}

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;

    if (code < 0x20 || code === 0x7f) return true;
  }

  return false;
}
