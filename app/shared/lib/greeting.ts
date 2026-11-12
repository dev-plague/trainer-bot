export const GREETING_PERIODS = ["morning", "afternoon", "evening"] as const;

export type GreetingPeriod = (typeof GREETING_PERIODS)[number];

/**
 * Mañana: 5–11 · Tarde: 12–19 · Noche: 20–4.
 * La hora debe ser la del cliente; el servidor no la usa para saludar.
 */
export function greetingPeriod(hour: number): GreetingPeriod {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`Hora inválida: ${hour}`);
  }

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 20) return "afternoon";

  return "evening";
}
