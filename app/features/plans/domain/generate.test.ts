import { describe, expect, it } from "vitest";

import type {
  Equipment,
  EquivalenceGroup,
  ExerciseLevel,
  ExercisePlace,
} from "~/features/exercises";
import { type PlanRequest, planRequestSchema } from "./contract";
import { type CandidateExercise, estimateDayWorkMinutes, generatePlan } from "./generate";

type CandidateOverrides = Partial<Omit<CandidateExercise, "slug" | "equivalenceGroup">> & {
  slug: string;
  equivalenceGroup: EquivalenceGroup;
};

function candidate(overrides: CandidateOverrides): CandidateExercise {
  return {
    place: "home" as ExercisePlace,
    level: "beginner" as ExerciseLevel,
    equipment: [] as Equipment[],
    contraindications: [],
    isComplex: false,
    ...overrides,
  };
}

const catalog: CandidateExercise[] = [
  candidate({ slug: "flexiones-rodillas", equivalenceGroup: "push" }),
  candidate({
    slug: "flexiones-diamante",
    equivalenceGroup: "push",
    level: "advanced",
    isComplex: true,
  }),
  candidate({
    slug: "press-mancuernas",
    equivalenceGroup: "push",
    place: "gym",
    level: "intermediate",
    equipment: ["mancuernas"],
    contraindications: ["Dolor activo de hombro"],
  }),
  candidate({ slug: "remo-toalla", equivalenceGroup: "pull" }),
  candidate({
    slug: "dominadas",
    equivalenceGroup: "pull",
    place: "gym",
    level: "advanced",
    equipment: ["barra-de-dominadas"],
    isComplex: true,
  }),
  candidate({
    slug: "sentadilla",
    equivalenceGroup: "squat",
    contraindications: ["Dolor agudo de rodilla"],
  }),
  candidate({
    slug: "zancadas",
    equivalenceGroup: "lunge",
    contraindications: ["Dolor agudo de rodilla"],
  }),
  candidate({ slug: "puente", equivalenceGroup: "hinge" }),
  candidate({ slug: "plancha", equivalenceGroup: "core" }),
  candidate({ slug: "plancha-lateral", equivalenceGroup: "core", level: "intermediate" }),
  candidate({ slug: "caminata", equivalenceGroup: "cardio", place: "outdoor" }),
  candidate({
    slug: "saltar-cuerda",
    equivalenceGroup: "cardio",
    level: "intermediate",
    equipment: ["cuerda"],
  }),
  candidate({ slug: "movilidad-cadera", equivalenceGroup: "mobility" }),
];

function request(overrides: Partial<PlanRequest> = {}): PlanRequest {
  return planRequestSchema.parse({
    goal: "general_health",
    level: "beginner",
    daysPerWeek: 3,
    sessionMinutes: 45,
    place: "home",
    equipment: [],
    limitations: "",
    mode: "strict",
    ...overrides,
  });
}

function selectedSlugs(plan: ReturnType<typeof generatePlan>): string[] {
  return plan.days.flatMap((day) => day.exercises.map((item) => item.exerciseSlug));
}

describe("generatePlan", () => {
  it("es determinista: la misma entrada produce el mismo plan", () => {
    const input = request();

    expect(generatePlan(input, catalog)).toEqual(generatePlan(input, catalog));
  });

  it("no repite un ejercicio dentro del mismo día", () => {
    for (const day of generatePlan(request(), catalog).days) {
      const slugs = day.exercises.map((item) => item.exerciseSlug);

      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("respeta el presupuesto de tiempo, incluidos calentamiento y enfriamiento", () => {
    const input = request({ sessionMinutes: 45 });

    for (const day of generatePlan(input, catalog).days) {
      expect(estimateDayWorkMinutes(day) + 10).toBeLessThanOrEqual(input.sessionMinutes + 0.01);
    }
  });

  it("nunca da ejercicios complejos a un principiante", () => {
    const slugs = selectedSlugs(generatePlan(request({ level: "beginner" }), catalog));

    expect(slugs).not.toContain("flexiones-diamante");
    expect(slugs).not.toContain("dominadas");
  });

  it("con equipo vacío solo elige ejercicios sin equipo", () => {
    const bySlug = new Map(catalog.map((exercise) => [exercise.slug, exercise]));

    for (const slug of selectedSlugs(generatePlan(request({ equipment: [] }), catalog))) {
      expect(bySlug.get(slug)?.equipment).toEqual([]);
    }
  });

  it("excluye contraindicaciones según las limitaciones declaradas", () => {
    const plan = generatePlan(request({ limitations: "me duele la rodilla" }), catalog);
    const slugs = selectedSlugs(plan);

    expect(slugs).not.toContain("sentadilla");
    expect(slugs).not.toContain("zancadas");
    expect(plan.warnings.some((warning) => warning.detail === "squat")).toBe(true);
  });

  it("si un patrón no tiene ejercicios disponibles, lo omite y avisa", () => {
    const sparse = [
      candidate({
        slug: "sentadilla-gym",
        equivalenceGroup: "squat",
        place: "gym",
        equipment: ["mancuernas"],
      }),
    ];

    const plan = generatePlan(request({ equipment: [], place: "home" }), sparse);

    expect(plan.days[0]?.exercises).toEqual([]);
    expect(plan.warnings).toContainEqual({ code: "missing_pattern", detail: "squat" });
  });

  it("reparte torso, pierna y cardio cuando hay cinco días", () => {
    const plan = generatePlan(request({ daysPerWeek: 5 }), catalog);

    expect(plan.days.map((day) => day.category)).toEqual([
      "upper",
      "lower",
      "upper",
      "lower",
      "cardio",
    ]);

    const cardioDay = plan.days[4];

    expect(cardioDay?.exercises[0]?.prescription.kind).toBe("cardio");
  });

  it("avisa cuando la sesión queda por debajo del mínimo útil", () => {
    const plan = generatePlan(request({ sessionMinutes: 20, daysPerWeek: 2 }), catalog);

    expect(plan.warnings.some((warning) => warning.code === "session_too_short")).toBe(true);
  });

  it("acepta equipo de gimnasio y lo usa", () => {
    const plan = generatePlan(
      request({ place: "gym", equipment: ["gimnasio-completo"], level: "intermediate" }),
      catalog,
    );
    const slugs = selectedSlugs(plan);

    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs.some((slug) => slug === "press-mancuernas" || slug === "dominadas")).toBe(true);
  });
});
