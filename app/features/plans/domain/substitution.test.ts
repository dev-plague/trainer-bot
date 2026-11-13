import { describe, expect, it } from "vitest";

import type { CandidateExercise, ExerciseContext } from "./generate";
import { availableSubstitutes } from "./substitution";

const context: ExerciseContext = {
  place: "home",
  equipment: [],
  level: "beginner",
  limitations: "",
};

function candidate(
  overrides: Partial<CandidateExercise> & Pick<CandidateExercise, "slug">,
): CandidateExercise {
  return {
    place: "home",
    level: "beginner",
    equipment: [],
    equivalenceGroup: "squat",
    contraindications: [],
    isComplex: false,
    ...overrides,
  };
}

const current = { slug: "sentadilla", equivalenceGroup: "squat" as const };

describe("availableSubstitutes", () => {
  it("solo devuelve ejercicios del mismo grupo y distintos al actual", () => {
    const catalog = [
      candidate({ slug: "sentadilla" }),
      candidate({ slug: "sentadilla-goblet" }),
      candidate({ slug: "flexiones", equivalenceGroup: "push" }),
    ];

    expect(availableSubstitutes(current, catalog, context).map((item) => item.slug)).toEqual([
      "sentadilla-goblet",
    ]);
  });

  it("respeta el equipo disponible", () => {
    const catalog = [
      candidate({ slug: "sentadilla-mancuerna", equipment: ["mancuernas"] }),
      candidate({ slug: "sentadilla-pared" }),
    ];

    expect(availableSubstitutes(current, catalog, context).map((item) => item.slug)).toEqual([
      "sentadilla-pared",
    ]);
  });

  it("excluye contraindicaciones según las limitaciones", () => {
    const catalog = [
      candidate({ slug: "sentadilla-profunda", contraindications: ["Dolor agudo de rodilla"] }),
      candidate({ slug: "sentadilla-pared" }),
    ];

    expect(
      availableSubstitutes(current, catalog, { ...context, limitations: "rodilla" }).map(
        (item) => item.slug,
      ),
    ).toEqual(["sentadilla-pared"]);
  });

  it("un principiante no puede cambiar a un complejo", () => {
    const catalog = [
      candidate({ slug: "sentadilla-pistol", level: "advanced", isComplex: true }),
      candidate({ slug: "sentadilla-pared" }),
    ];

    expect(availableSubstitutes(current, catalog, context).map((item) => item.slug)).toEqual([
      "sentadilla-pared",
    ]);
  });

  it("devuelve una lista ordenada y estable", () => {
    const catalog = [
      candidate({ slug: "sentadilla-b" }),
      candidate({ slug: "sentadilla-a" }),
      candidate({ slug: "sentadilla-c" }),
    ];

    expect(availableSubstitutes(current, catalog, context).map((item) => item.slug)).toEqual([
      "sentadilla-a",
      "sentadilla-b",
      "sentadilla-c",
    ]);
  });
});
