export const ADULT_AGE = 18;

/** Devuelve la fecha o `null` si no es una fecha real (p. ej. 2020-02-31). */
export function parseBirthDate(value: string): Date | null {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) return null;
  if (!date.toISOString().startsWith(value)) return null;

  return date;
}

/** Edad cumplida en años, calculada en UTC. `null` si la fecha no es válida. */
export function calculateAge(birthDate: string, today: Date = new Date()): number | null {
  const birth = parseBirthDate(birthDate);

  if (!birth) return null;

  const years = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - birth.getUTCMonth();
  const dayDifference = today.getUTCDate() - birth.getUTCDate();
  const hasHadBirthday = monthDifference > 0 || (monthDifference === 0 && dayDifference >= 0);

  return hasHadBirthday ? years : years - 1;
}

export function isAdult(birthDate: string, today: Date = new Date()): boolean {
  const age = calculateAge(birthDate, today);

  return age !== null && age >= ADULT_AGE;
}
