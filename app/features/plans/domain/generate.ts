import type {
  Equipment,
  EquivalenceGroup,
  ExerciseLevel,
  ExercisePlace,
} from "~/features/exercises";
import {
  ENGINE_VERSION,
  type GeneratedPlan,
  type PlanDay,
  type PlanDayCategory,
  type PlanExercisePrescription,
  type PlanRequest,
  type PlanWarning,
} from "./contract";
import { type EffectiveProfile, profileFor } from "./profiles";

/** Lo mínimo que el motor necesita de un ejercicio. Sin base de datos. */
export type CandidateExercise = {
  slug: string;
  place: ExercisePlace;
  level: ExerciseLevel;
  equipment: Equipment[];
  equivalenceGroup: EquivalenceGroup;
  contraindications: string[];
  isComplex: boolean;
};

const WARMUP_MINUTES = 5;
const COOLDOWN_MINUTES = 5;
const SECONDS_PER_REP = 3;
const MIN_WORK_MINUTES = 10;
const MAX_EXERCISES_PER_DAY = 8;
const MAX_CARDIO_MINUTES = 40;

const FULL_BODY: readonly EquivalenceGroup[] = ["push", "pull", "squat", "hinge", "core"];
const UPPER: readonly EquivalenceGroup[] = ["push", "pull", "core"];
const LOWER: readonly EquivalenceGroup[] = ["squat", "hinge", "lunge"];
const STRENGTH_GROUPS: readonly EquivalenceGroup[] = [
  "push",
  "pull",
  "squat",
  "lunge",
  "hinge",
  "core",
];

function dayCategories(days: number): PlanDayCategory[] {
  if (days <= 3) return Array.from({ length: days }, () => "full_body");
  if (days === 4) return ["upper", "lower", "upper", "lower"];

  return ["upper", "lower", "upper", "lower", "cardio"];
}

function patternsFor(category: PlanDayCategory): readonly EquivalenceGroup[] {
  switch (category) {
    case "full_body":
      return FULL_BODY;
    case "upper":
      return UPPER;
    case "lower":
      return LOWER;
    case "cardio":
      return [];
  }
}

export function generatePlan(
  request: PlanRequest,
  catalog: readonly CandidateExercise[],
): GeneratedPlan {
  const profile = profileFor(request.goal, request.level);
  const warnings: PlanWarning[] = [];
  const days = dayCategories(request.daysPerWeek).map((category, dayIndex) =>
    buildDay(dayIndex, category, request, profile, catalog, warnings),
  );

  return {
    engineVersion: ENGINE_VERSION,
    goal: request.goal,
    level: request.level,
    mode: request.mode,
    days,
    warnings: dedupeWarnings(warnings),
  };
}

function buildDay(
  dayIndex: number,
  category: PlanDayCategory,
  request: PlanRequest,
  profile: EffectiveProfile,
  catalog: readonly CandidateExercise[],
  warnings: PlanWarning[],
): PlanDay {
  const budgetSeconds = Math.max(
    0,
    (request.sessionMinutes - WARMUP_MINUTES - COOLDOWN_MINUTES) * 60,
  );
  const pool = catalog.filter((exercise) => isExerciseAvailable(exercise, request));

  const exercises =
    category === "cardio"
      ? buildCardioDay(pool, request, profile, budgetSeconds, warnings)
      : buildStrengthDay(pool, request, profile, budgetSeconds, category, warnings);

  const workMinutes = estimateDayWorkMinutes({ dayIndex, category, isRest: false, exercises });

  if (workMinutes < MIN_WORK_MINUTES) {
    warnings.push({ code: "session_too_short", detail: String(dayIndex + 1) });
  }

  return { dayIndex, category, isRest: false, exercises };
}

function buildStrengthDay(
  pool: readonly CandidateExercise[],
  request: PlanRequest,
  profile: EffectiveProfile,
  budgetSeconds: number,
  category: PlanDayCategory,
  warnings: PlanWarning[],
): PlanExercisePrescription[] {
  const exercises: PlanExercisePrescription[] = [];
  const used = new Set<string>();
  let usedSeconds = 0;

  const required = patternsFor(category);
  const optional = STRENGTH_GROUPS.filter((group) => !required.includes(group));

  for (const pattern of [...required, ...optional]) {
    if (exercises.length >= MAX_EXERCISES_PER_DAY) break;

    const exercise = pickExercise(pattern, pool, used, request.level);

    if (!exercise) {
      if (required.includes(pattern)) {
        warnings.push({ code: "missing_pattern", detail: pattern });
      }

      continue;
    }

    const prescription =
      pattern === "mobility"
        ? mobilityPrescription(budgetSeconds - usedSeconds)
        : fitStrength(profile, budgetSeconds - usedSeconds);

    if (!prescription) continue;

    exercises.push({ exerciseSlug: exercise.slug, prescription });
    used.add(exercise.slug);
    usedSeconds += prescriptionSeconds(prescription);
  }

  const cardio = pickExercise("cardio", pool, used, request.level);
  const remainingMinutes = Math.floor((budgetSeconds - usedSeconds) / 60);

  if (cardio && remainingMinutes >= MIN_WORK_MINUTES) {
    const minutes = Math.min(MAX_CARDIO_MINUTES, remainingMinutes);

    exercises.push({
      exerciseSlug: cardio.slug,
      prescription: { kind: "cardio", minutes, intensity: profile.cardio.intensity },
    });
  }

  return exercises;
}

function buildCardioDay(
  pool: readonly CandidateExercise[],
  request: PlanRequest,
  profile: EffectiveProfile,
  budgetSeconds: number,
  warnings: PlanWarning[],
): PlanExercisePrescription[] {
  const exercise = pickExercise("cardio", pool, new Set(), request.level);

  if (!exercise) {
    warnings.push({ code: "missing_pattern", detail: "cardio" });

    return [];
  }

  const minutes = Math.min(MAX_CARDIO_MINUTES, Math.floor(budgetSeconds / 60));

  if (minutes < MIN_WORK_MINUTES) {
    return [];
  }

  return [
    {
      exerciseSlug: exercise.slug,
      prescription: { kind: "cardio", minutes, intensity: profile.cardio.intensity },
    },
  ];
}

function mobilityPrescription(
  remainingSeconds: number,
): Extract<PlanExercisePrescription["prescription"], { kind: "mobility" }> | null {
  const sets = 2;
  const reps = 8;
  const cost = sets * reps * SECONDS_PER_REP;

  if (cost > remainingSeconds) return null;

  return { kind: "mobility", sets, reps };
}

function fitStrength(
  profile: EffectiveProfile,
  remainingSeconds: number,
): Extract<PlanExercisePrescription["prescription"], { kind: "strength" }> | null {
  const reps = Math.round((profile.reps.min + profile.reps.max) / 2);

  for (const sets of [profile.sets.max, profile.sets.min]) {
    const restSeconds = profile.restSeconds.max;
    const cost = sets * (reps * SECONDS_PER_REP + restSeconds);

    if (cost <= remainingSeconds) {
      return {
        kind: "strength",
        sets,
        reps,
        rir: profile.rir.max,
        restSeconds,
      };
    }
  }

  return null;
}

function pickExercise(
  group: EquivalenceGroup,
  pool: readonly CandidateExercise[],
  used: ReadonlySet<string>,
  level: ExerciseLevel,
): CandidateExercise | null {
  const candidates = pool
    .filter((exercise) => exercise.equivalenceGroup === group && !used.has(exercise.slug))
    .sort(
      (a, b) =>
        levelScore(a.level, level) - levelScore(b.level, level) || a.slug.localeCompare(b.slug),
    );

  return candidates[0] ?? null;
}

function levelScore(exerciseLevel: ExerciseLevel, requestLevel: ExerciseLevel): number {
  if (exerciseLevel === requestLevel) return 0;

  const order: ExerciseLevel[] = ["beginner", "intermediate", "advanced"];
  const distance = order.indexOf(exerciseLevel) - order.indexOf(requestLevel);

  return distance < 0 ? 1 : 2;
}

export type ExerciseContext = {
  place: ExercisePlace;
  equipment: readonly Equipment[];
  level: ExerciseLevel;
  limitations: string;
};

/**
 * Mismas reglas para generar y para sustituir en modo flexible: lugar, equipo,
 * nivel (sin complejos para principiantes) y limitaciones.
 */
export function isExerciseAvailable(
  exercise: CandidateExercise,
  context: ExerciseContext,
): boolean {
  if (context.level === "beginner" && exercise.isComplex) return false;
  if (!placeAllows(exercise, context.place)) return false;
  if (!equipmentAllows(context.equipment, exercise.equipment)) return false;
  if (isContraindicated(exercise, context.limitations)) return false;

  return true;
}

function placeAllows(exercise: CandidateExercise, place: ExercisePlace): boolean {
  // El cardio se puede hacer en cualquier sitio (salir a caminar no depende del lugar).
  if (exercise.equivalenceGroup === "cardio") return true;
  if (exercise.place === place) return true;

  // Los ejercicios de peso corporal de casa valen en cualquier lugar.
  return exercise.place === "home" && exercise.equipment.length === 0;
}

function equipmentAllows(available: readonly Equipment[], needed: readonly Equipment[]): boolean {
  if (needed.length === 0) return true;

  const hasGym = available.includes("gimnasio-completo");

  return needed.every((item) => hasGym || available.includes(item));
}

function isContraindicated(exercise: CandidateExercise, limitations: string): boolean {
  const words = normalize(limitations)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4);

  if (words.length === 0) return false;

  return exercise.contraindications.some((contraindication) => {
    const text = normalize(contraindication);

    return words.some((word) => text.includes(word));
  });
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function prescriptionSeconds(prescription: PlanExercisePrescription["prescription"]): number {
  if (prescription.kind === "strength") {
    return prescription.sets * (prescription.reps * SECONDS_PER_REP + prescription.restSeconds);
  }

  if (prescription.kind === "cardio") return prescription.minutes * 60;

  return prescription.sets * prescription.reps * SECONDS_PER_REP;
}

export function estimateDayWorkMinutes(day: PlanDay): number {
  const seconds = day.exercises.reduce(
    (total, item) => total + prescriptionSeconds(item.prescription),
    0,
  );

  return Math.round((seconds / 60) * 10) / 10;
}

function dedupeWarnings(warnings: PlanWarning[]): PlanWarning[] {
  const seen = new Set<string>();

  return warnings.filter((warning) => {
    const key = `${warning.code}:${warning.detail ?? ""}`;

    if (seen.has(key)) return false;

    seen.add(key);

    return true;
  });
}
