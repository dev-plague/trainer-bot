import type { PlanExercisePrescription } from "./contract";

export type ExercisePrescription = PlanExercisePrescription["prescription"];

/** Prescripción repetida en todas las tarjetas de un día de fuerza o isométricos. */
export type SharedDayPrescription = Extract<
  ExercisePrescription,
  { kind: "strength" | "isometric" }
>;

/** Dos prescripciones son iguales si comparten forma y todos sus valores. */
export function samePrescription(a: ExercisePrescription, b: ExercisePrescription): boolean {
  if (a.kind !== b.kind) return false;

  switch (a.kind) {
    case "strength": {
      const other = b as typeof a;

      return (
        a.sets === other.sets &&
        a.rir === other.rir &&
        a.restSeconds === other.restSeconds &&
        a.reps.min === other.reps.min &&
        a.reps.max === other.reps.max
      );
    }
    case "isometric": {
      const other = b as typeof a;

      return (
        a.sets === other.sets &&
        a.restSeconds === other.restSeconds &&
        a.seconds.min === other.seconds.min &&
        a.seconds.max === other.seconds.max
      );
    }
    case "cardio": {
      const other = b as typeof a;

      return a.minutes === other.minutes && a.intensity === other.intensity;
    }
    case "mobility": {
      const other = b as typeof a;

      return (
        a.sets === other.sets &&
        a.seconds.min === other.seconds.min &&
        a.seconds.max === other.seconds.max &&
        a.restSeconds === other.restSeconds
      );
    }
  }
}

/**
 * Devuelve la prescripción que se repite en el día cuando todas las de un mismo
 * tipo (fuerza o isométricos) tienen los mismos valores. Así la cabecera la
 * muestra una sola vez y las tarjetas solo enseñan lo que cambia.
 */
export function sharedDayPrescription(
  prescriptions: readonly ExercisePrescription[],
): SharedDayPrescription | null {
  const strengths = prescriptions.filter((prescription) => prescription.kind === "strength");
  const isometrics = prescriptions.filter((prescription) => prescription.kind === "isometric");

  if (strengths.length >= 2 && allEqual(strengths)) {
    return strengths[0] as SharedDayPrescription;
  }

  if (isometrics.length >= 2 && allEqual(isometrics)) {
    return isometrics[0] as SharedDayPrescription;
  }

  return null;
}

function allEqual(prescriptions: readonly ExercisePrescription[]): boolean {
  const [first] = prescriptions;

  if (!first) return false;

  return prescriptions.every((prescription) => samePrescription(first, prescription));
}
