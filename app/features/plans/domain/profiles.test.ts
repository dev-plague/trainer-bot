import { describe, expect, it } from "vitest";

import type { ExerciseLevel } from "~/features/exercises";
import { LEVEL_MODIFIERS, PLAN_GOALS, PLAN_PROFILES, profileFor } from "./profiles";

const LEVELS: ExerciseLevel[] = ["beginner", "intermediate", "advanced"];

describe("PLAN_PROFILES", () => {
  it("cada objetivo tiene fuente", () => {
    for (const goal of PLAN_GOALS) {
      expect(PLAN_PROFILES[goal].source.length).toBeGreaterThan(0);
    }
  });

  it("ningún perfil permite RIR menor que 2", () => {
    for (const goal of PLAN_GOALS) {
      expect(PLAN_PROFILES[goal].rir.min).toBeGreaterThanOrEqual(2);
    }
  });

  it("los rangos están ordenados", () => {
    for (const goal of PLAN_GOALS) {
      const profile = PLAN_PROFILES[goal];

      for (const range of [
        profile.strengthDaysPerWeek,
        profile.sets,
        profile.reps,
        profile.rir,
        profile.restSeconds,
        profile.cardio.sessionsPerWeek,
      ]) {
        expect(range.min).toBeLessThanOrEqual(range.max);
        expect(range.min).toBeGreaterThan(0);
      }
    }
  });
});

describe("profileFor", () => {
  it("el principiante baja una serie, sube RIR y descansa más", () => {
    const beginner = profileFor("strength", "beginner");

    expect(beginner.sets).toEqual({ min: 1, max: 2 });
    expect(beginner.rir).toEqual({ min: 3, max: 4 });
    expect(beginner.restSeconds).toEqual({ min: 105, max: 135 });
    expect(beginner.allowComplex).toBe(false);
  });

  it("intermedio y avanzado conservan el perfil base", () => {
    const base = PLAN_PROFILES.fat_loss;

    expect(profileFor("fat_loss", "intermediate").sets).toEqual(base.sets);
    expect(profileFor("fat_loss", "advanced").rir).toEqual(base.rir);
    expect(LEVEL_MODIFIERS.advanced.allowComplex).toBe(true);
  });

  it("ningún nivel ni objetivo permite RIR menor que 2", () => {
    for (const goal of PLAN_GOALS) {
      for (const level of LEVELS) {
        expect(profileFor(goal, level).rir.min).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("el principiante nunca puede recibir ejercicios complejos", () => {
    for (const goal of PLAN_GOALS) {
      expect(profileFor(goal, "beginner").allowComplex).toBe(false);
    }
  });
});
