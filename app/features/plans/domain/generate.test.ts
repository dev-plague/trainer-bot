import { describe, expect, it } from "vitest";

import type {
  Equipment,
  EquivalenceGroup,
  ExerciseLevel,
  ExercisePlace,
} from "~/features/exercises";
import type { MuscleGroup } from "~/features/exercises/domain/muscles";
import { type PlanRequest, planRequestSchema } from "./contract";
import {
  type CandidateExercise,
  COOLDOWN_MINUTES,
  estimateDayWorkMinutes,
  estimateMainWorkMinutes,
  generatePlan,
  WARMUP_MINUTES,
} from "./generate";
import { profileFor } from "./profiles";

type CandidateOverrides = Partial<Omit<CandidateExercise, "slug" | "equivalenceGroup">> & {
  slug: string;
  equivalenceGroup: EquivalenceGroup;
};

function candidate(overrides: CandidateOverrides): CandidateExercise {
  const { primaryMuscles, measure, mobilityPhase, ...rest } = overrides;

  return {
    place: "home" as ExercisePlace,
    level: "beginner" as ExerciseLevel,
    equipment: [] as Equipment[],
    contraindications: [],
    isComplex: false,
    ...rest,
    mobilityPhase: mobilityPhase ?? null,
    primaryMuscles: primaryMuscles ?? ([] as MuscleGroup[]),
    measure: measure ?? "reps",
  };
}

const catalog: CandidateExercise[] = [
  candidate({
    slug: "flexiones-rodillas",
    equivalenceGroup: "push",
    primaryMuscles: ["chest", "triceps"],
  }),
  candidate({
    slug: "flexiones-inclinadas",
    equivalenceGroup: "push",
    primaryMuscles: ["chest", "triceps"],
  }),
  candidate({
    slug: "flexiones-diamante",
    equivalenceGroup: "push",
    level: "advanced",
    isComplex: true,
    primaryMuscles: ["chest", "triceps"],
  }),
  candidate({
    slug: "press-mancuernas",
    equivalenceGroup: "push",
    place: "gym",
    level: "intermediate",
    equipment: ["mancuernas"],
    primaryMuscles: ["chest", "shoulders"],
    contraindications: ["Dolor activo de hombro"],
  }),
  candidate({
    slug: "press-militar",
    equivalenceGroup: "push",
    level: "intermediate",
    equipment: ["mancuernas"],
    primaryMuscles: ["shoulders", "triceps"],
  }),
  candidate({
    slug: "remo-toalla",
    equivalenceGroup: "pull",
    primaryMuscles: ["back", "biceps"],
  }),
  candidate({
    slug: "remo-toalla-una-mano",
    equivalenceGroup: "pull",
    primaryMuscles: ["back", "biceps"],
  }),
  candidate({
    slug: "dominadas",
    equivalenceGroup: "pull",
    place: "gym",
    level: "advanced",
    equipment: ["barra-de-dominadas"],
    isComplex: true,
    primaryMuscles: ["back", "biceps"],
  }),
  candidate({
    slug: "curl-mancuerna",
    equivalenceGroup: "pull",
    level: "intermediate",
    equipment: ["mancuernas"],
    primaryMuscles: ["biceps"],
  }),
  candidate({
    slug: "sentadilla",
    equivalenceGroup: "squat",
    primaryMuscles: ["quads", "glutes"],
    contraindications: ["Dolor agudo de rodilla"],
  }),
  candidate({
    slug: "sentadilla-sumo",
    equivalenceGroup: "squat",
    primaryMuscles: ["quads", "glutes"],
    contraindications: ["Dolor agudo de rodilla o ingle"],
  }),
  candidate({
    slug: "zancadas",
    equivalenceGroup: "lunge",
    primaryMuscles: ["quads", "glutes"],
    contraindications: ["Dolor agudo de rodilla"],
  }),
  candidate({
    slug: "puente",
    equivalenceGroup: "hinge",
    primaryMuscles: ["glutes", "hamstrings"],
  }),
  candidate({
    slug: "puente-una-pierna",
    equivalenceGroup: "hinge",
    level: "intermediate",
    primaryMuscles: ["glutes", "hamstrings"],
  }),
  candidate({
    slug: "plancha",
    equivalenceGroup: "core",
    measure: "seconds",
    primaryMuscles: ["core"],
  }),
  candidate({
    slug: "plancha-lateral",
    equivalenceGroup: "core",
    level: "intermediate",
    measure: "seconds",
    primaryMuscles: ["core"],
  }),
  candidate({
    slug: "elevacion-talones",
    equivalenceGroup: "calves",
    primaryMuscles: ["calves"],
  }),
  candidate({
    slug: "caminata",
    equivalenceGroup: "cardio",
    place: "outdoor",
    primaryMuscles: ["quads", "glutes"],
  }),
  candidate({
    slug: "saltar-cuerda",
    equivalenceGroup: "cardio",
    level: "intermediate",
    equipment: ["cuerda"],
    primaryMuscles: ["quads", "calves"],
  }),
  candidate({
    slug: "movilidad-de-cadera",
    equivalenceGroup: "mobility",
    mobilityPhase: "warmup",
    measure: "seconds",
    primaryMuscles: ["glutes"],
    contraindications: ["Dolor agudo de cadera"],
  }),
  candidate({
    slug: "movilidad-de-tobillo",
    equivalenceGroup: "mobility",
    mobilityPhase: "warmup",
    measure: "seconds",
    primaryMuscles: ["calves"],
  }),
  candidate({
    slug: "movilidad-de-hombro",
    equivalenceGroup: "mobility",
    mobilityPhase: "warmup",
    measure: "seconds",
    primaryMuscles: ["shoulders"],
  }),
  candidate({
    slug: "movilidad-de-columna-toracica",
    equivalenceGroup: "mobility",
    mobilityPhase: "warmup",
    measure: "seconds",
    primaryMuscles: ["back"],
  }),
  candidate({
    slug: "estiramiento-de-isquiotibiales",
    equivalenceGroup: "mobility",
    mobilityPhase: "cooldown",
    measure: "seconds",
    primaryMuscles: ["hamstrings"],
  }),
  candidate({
    slug: "estiramiento-de-gemelos",
    equivalenceGroup: "mobility",
    mobilityPhase: "cooldown",
    measure: "seconds",
    primaryMuscles: ["calves"],
  }),
  candidate({
    slug: "estiramiento-de-pecho",
    equivalenceGroup: "mobility",
    mobilityPhase: "cooldown",
    measure: "seconds",
    primaryMuscles: ["chest"],
  }),
  candidate({
    slug: "estiramiento-de-espalda",
    equivalenceGroup: "mobility",
    mobilityPhase: "cooldown",
    measure: "seconds",
    primaryMuscles: ["back"],
  }),
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
    for (const days of [2, 3, 4, 5]) {
      for (const day of generatePlan(request({ daysPerWeek: days }), catalog).days) {
        const slugs = day.exercises.map((item) => item.exerciseSlug);

        expect(new Set(slugs).size).toBe(slugs.length);
      }
    }
  });

  it("respeta el presupuesto de tiempo, incluidos calentamiento y enfriamiento", () => {
    for (const days of [2, 3, 4, 5]) {
      const input = request({ sessionMinutes: 45, daysPerWeek: days });

      for (const day of generatePlan(input, catalog).days) {
        expect(estimateDayWorkMinutes(day)).toBeLessThanOrEqual(input.sessionMinutes + 0.01);
        expect(estimateDayWorkMinutes(day) - estimateMainWorkMinutes(day)).toBeCloseTo(
          WARMUP_MINUTES + COOLDOWN_MINUTES,
          5,
        );
      }
    }
  });

  it("todo día abre con calentamiento y cierra con enfriamiento", () => {
    const phaseBySlug = new Map(catalog.map((exercise) => [exercise.slug, exercise.mobilityPhase]));

    for (const days of [2, 3, 4, 5]) {
      for (const day of generatePlan(request({ daysPerWeek: days }), catalog).days) {
        const first = day.exercises[0];
        const last = day.exercises.at(-1);

        expect(first?.prescription.kind).toBe("mobility");
        expect(last?.prescription.kind).toBe("mobility");
        expect(phaseBySlug.get(first?.exerciseSlug ?? "")).toBe("warmup");
        expect(phaseBySlug.get(last?.exerciseSlug ?? "")).toBe("cooldown");
        expect(
          day.exercises.filter((item) => phaseBySlug.get(item.exerciseSlug) === "warmup"),
        ).toHaveLength(2);
        expect(
          day.exercises.filter((item) => phaseBySlug.get(item.exerciseSlug) === "cooldown"),
        ).toHaveLength(2);
      }
    }
  });

  it("un día de pierna calienta cadera y tobillo", () => {
    const plan = generatePlan(request({ daysPerWeek: 4 }), catalog);
    const lowerDays = plan.days.filter((day) => day.category === "lower");

    expect(lowerDays).toHaveLength(2);

    for (const day of lowerDays) {
      const warmup = day.exercises
        .filter((item) => item.prescription.kind === "mobility")
        .slice(0, 2)
        .map((item) => item.exerciseSlug);

      expect(warmup).toEqual(["movilidad-de-cadera", "movilidad-de-tobillo"]);
    }
  });

  it("un día de torso calienta hombro y columna torácica", () => {
    const plan = generatePlan(request({ daysPerWeek: 4 }), catalog);
    const upperDays = plan.days.filter((day) => day.category === "upper");

    expect(upperDays).toHaveLength(2);

    for (const day of upperDays) {
      const warmup = day.exercises.slice(0, 2).map((item) => item.exerciseSlug);

      expect(warmup).toEqual(["movilidad-de-hombro", "movilidad-de-columna-toracica"]);
    }
  });

  it("un día de cuerpo completo combina cadera y hombro al calentar", () => {
    const day = generatePlan(request({ daysPerWeek: 2 }), catalog).days[0];
    const mobility = day?.exercises.filter((item) => item.prescription.kind === "mobility") ?? [];

    expect(mobility.slice(0, 2).map((item) => item.exerciseSlug)).toEqual([
      "movilidad-de-cadera",
      "movilidad-de-hombro",
    ]);
    expect(mobility.slice(2).map((item) => item.exerciseSlug)).toEqual([
      "estiramiento-de-isquiotibiales",
      "estiramiento-de-pecho",
    ]);
  });

  it("excluye la movilidad contraindicada por las limitaciones declaradas", () => {
    const plan = generatePlan(
      request({ daysPerWeek: 2, limitations: "me duele la cadera" }),
      catalog,
    );
    const mobilitySlugs = plan.days
      .flatMap((day) => day.exercises)
      .filter((item) => item.prescription.kind === "mobility")
      .map((item) => item.exerciseSlug);

    expect(mobilitySlugs).not.toContain("movilidad-de-cadera");
    expect(mobilitySlugs).toContain("movilidad-de-tobillo");
  });

  it("ningún paso de movilidad requiere equipo", () => {
    const equipmentBySlug = new Map(catalog.map((exercise) => [exercise.slug, exercise.equipment]));

    for (const day of generatePlan(request({ daysPerWeek: 5 }), catalog).days) {
      for (const item of day.exercises) {
        if (item.prescription.kind !== "mobility") continue;

        expect(equipmentBySlug.get(item.exerciseSlug)).toEqual([]);
      }
    }
  });

  it("con poco tiempo conserva la movilidad y recorta el trabajo principal", () => {
    const input = request({ sessionMinutes: 20, daysPerWeek: 3 });
    const plan = generatePlan(input, catalog);

    for (const day of plan.days) {
      const mobility = day.exercises.filter((item) => item.prescription.kind === "mobility");

      expect(mobility).toHaveLength(4);
      expect(estimateMainWorkMinutes(day)).toBeLessThanOrEqual(
        input.sessionMinutes - WARMUP_MINUTES - COOLDOWN_MINUTES + 0.01,
      );
      expect(estimateDayWorkMinutes(day)).toBeLessThanOrEqual(input.sessionMinutes + 0.01);
    }
  });

  it("no da ejercicios complejos a un principiante", () => {
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
        primaryMuscles: ["quads"],
      }),
    ];

    const plan = generatePlan(request({ equipment: [], place: "home" }), sparse);

    expect(plan.warnings).toContainEqual({ code: "missing_pattern", detail: "squat" });
  });

  it("con dos días usa cuerpo completo y varía los ejercicios entre A y B", () => {
    const plan = generatePlan(request({ daysPerWeek: 2 }), catalog);
    const first = plan.days[0]?.exercises.map((item) => item.exerciseSlug) ?? [];
    const second = plan.days[1]?.exercises.map((item) => item.exerciseSlug) ?? [];

    expect(plan.days.map((day) => day.category)).toEqual(["full_body", "full_body"]);
    expect(first.length).toBeGreaterThan(0);
    expect(second).not.toEqual(first);
  });

  it("con tres días segmenta empuje, tirón y piernas", () => {
    const plan = generatePlan(request({ daysPerWeek: 3 }), catalog);

    expect(plan.days.map((day) => day.category)).toEqual([
      "push_quads",
      "pull_posterior",
      "legs_shoulders_core",
    ]);
  });

  it("con cuatro días alterna torso y pierna con variantes", () => {
    const plan = generatePlan(request({ daysPerWeek: 4 }), catalog);
    const [a, b, c, d] = plan.days.map((day) => day.exercises.map((item) => item.exerciseSlug));

    expect(plan.days.map((day) => day.category)).toEqual(["upper", "lower", "upper", "lower"]);
    expect(a).not.toEqual(c);
    expect(b).not.toEqual(d);
  });

  it("con cinco días deja el último para cardio", () => {
    const plan = generatePlan(request({ daysPerWeek: 5 }), catalog);

    expect(plan.days.map((day) => day.category)).toEqual([
      "push_quads",
      "pull_posterior",
      "legs_shoulders_core",
      "upper",
      "cardio",
    ]);
    expect(plan.days[4]?.exercises.some((item) => item.prescription.kind === "cardio")).toBe(true);
  });

  it("no supera las sesiones de cardio del perfil", () => {
    const input = request({
      goal: "strength",
      level: "intermediate",
      daysPerWeek: 4,
      sessionMinutes: 60,
    });
    const plan = generatePlan(input, catalog);
    const cardioDays = plan.days.filter((day) =>
      day.exercises.some((item) => item.prescription.kind === "cardio"),
    ).length;

    expect(cardioDays).toBeLessThanOrEqual(
      profileFor(input.goal, input.level).cardio.sessionsPerWeek.max,
    );
  });

  it("prescribe los isométricos en segundos", () => {
    const plan = generatePlan(request({ daysPerWeek: 3 }), catalog);
    const isometrics = plan.days
      .flatMap((day) => day.exercises)
      .filter((item) => item.prescription.kind === "isometric");

    expect(isometrics.length).toBeGreaterThan(0);

    for (const item of isometrics) {
      if (item.prescription.kind !== "isometric") continue;

      expect(item.prescription.seconds.min).toBeLessThanOrEqual(item.prescription.seconds.max);
      expect(item.prescription.seconds.max).toBeLessThanOrEqual(60);
    }
  });

  it("usa rangos de repeticiones dentro del perfil", () => {
    const input = request({ level: "intermediate", daysPerWeek: 3 });
    const profile = profileFor(input.goal, input.level);
    const strength = generatePlan(input, catalog)
      .days.flatMap((day) => day.exercises)
      .filter((item) => item.prescription.kind === "strength");

    expect(strength.length).toBeGreaterThan(0);

    for (const item of strength) {
      if (item.prescription.kind !== "strength") continue;

      expect(item.prescription.reps.min).toBe(profile.reps.min);
      expect(item.prescription.reps.max).toBe(profile.reps.max);
      expect(item.prescription.sets).toBeGreaterThanOrEqual(profile.sets.min);
      expect(item.prescription.sets).toBeLessThanOrEqual(profile.sets.max);
    }
  });

  it("avisa cuando la sesión queda por debajo del mínimo útil", () => {
    const sparse = [
      candidate({ slug: "sentadilla", equivalenceGroup: "squat", primaryMuscles: ["quads"] }),
    ];
    const plan = generatePlan(request({ sessionMinutes: 20, daysPerWeek: 2 }), sparse);

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
