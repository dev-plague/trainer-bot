import { describe, expect, it } from "vitest";

import { EXERCISES } from "../data/seed-data";
import { EQUIVALENCE_GROUPS, validateSeed } from "./exercise-seed";

const { exercises, byGroup } = validateSeed(EXERCISES);

describe("invariante del catálogo", () => {
  it("cada patrón tiene un ejercicio sin equipo para principiantes", () => {
    const missing = EQUIVALENCE_GROUPS.filter(
      (group) =>
        !exercises.some(
          (exercise) =>
            exercise.equivalenceGroup === group &&
            exercise.equipment.length === 0 &&
            exercise.level === "beginner",
        ),
    );

    expect(missing).toEqual([]);
  });

  it("cada grupo tiene al menos dos ejercicios intercambiables", () => {
    const thin = EQUIVALENCE_GROUPS.filter((group) => (byGroup.get(group)?.length ?? 0) < 2);

    expect(thin).toEqual([]);
  });
});
