import { describe, expect, it } from "vitest";

import type { PlanExercisePrescription } from "./contract";
import { samePrescription, sharedDayPrescription } from "./day-summary";

type Prescription = PlanExercisePrescription["prescription"];

const strength: Prescription = {
  kind: "strength",
  sets: 2,
  reps: { min: 8, max: 12 },
  rir: 4,
  restSeconds: 135,
};

describe("sharedDayPrescription", () => {
  it("devuelve la prescripción común cuando todo el día es igual", () => {
    expect(sharedDayPrescription([strength, { ...strength }])).toEqual(strength);
  });

  it("comparte la base de fuerza aunque un ejercicio sea isométrico", () => {
    expect(
      sharedDayPrescription([
        strength,
        { ...strength },
        { kind: "isometric", sets: 2, seconds: { min: 20, max: 45 }, restSeconds: 45 },
      ]),
    ).toEqual(strength);
  });

  it("no la devuelve si los ejercicios de fuerza cambian entre sí", () => {
    expect(sharedDayPrescription([strength, { ...strength, sets: 1 }])).toBeNull();
  });

  it("no repite la cabecera con un solo ejercicio", () => {
    expect(sharedDayPrescription([strength])).toBeNull();
  });

  it("no la devuelve si el día solo tiene cardio", () => {
    expect(
      sharedDayPrescription([
        { kind: "cardio", minutes: 20, intensity: "moderate" },
        { kind: "cardio", minutes: 20, intensity: "moderate" },
      ]),
    ).toBeNull();
  });
});

describe("samePrescription", () => {
  it("distingue rangos de repeticiones distintos", () => {
    expect(samePrescription(strength, { ...strength, reps: { min: 8, max: 10 } })).toBe(false);
  });

  it("distingue tipos distintos", () => {
    expect(
      samePrescription(strength, {
        kind: "mobility",
        sets: 2,
        seconds: { min: 60, max: 60 },
        restSeconds: 15,
      }),
    ).toBe(false);
  });
});
