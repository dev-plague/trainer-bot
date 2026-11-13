import type { Equipment } from "~/features/exercises/domain/equipment";
import type {
  EquivalenceGroup,
  ExerciseLevel,
  ExercisePlace,
} from "~/features/exercises/domain/exercise-seed";
import type { ExerciseMeasure, MuscleGroup } from "~/features/exercises/domain/muscles";
import {
  ENGINE_VERSION,
  type GeneratedPlan,
  type PlanDay,
  type PlanExercisePrescription,
  type PlanRequest,
  type PlanWarning,
} from "./contract";
import { type EffectiveProfile, profileFor } from "./profiles";
import { type DaySlot, type DayTemplate, templatesForDays } from "./templates";

/** Lo mínimo que el motor necesita de un ejercicio. Sin base de datos. */
export type CandidateExercise = {
  slug: string;
  place: ExercisePlace;
  level: ExerciseLevel;
  equipment: Equipment[];
  equivalenceGroup: EquivalenceGroup;
  primaryMuscles: MuscleGroup[];
  measure: ExerciseMeasure;
  contraindications: string[];
  isComplex: boolean;
};

const WARMUP_MINUTES = 5;
const COOLDOWN_MINUTES = 5;
const SECONDS_PER_REP = 3;
const MIN_WORK_MINUTES = 10;
const MAX_EXERCISES_PER_DAY = 8;
const MAX_CARDIO_MINUTES = 20;

export function generatePlan(
  request: PlanRequest,
  catalog: readonly CandidateExercise[],
): GeneratedPlan {
  const profile = profileFor(request.goal, request.level);
  const warnings: PlanWarning[] = [];
  const templates = templatesForDays(request.daysPerWeek);
  const hasDedicatedCardio = templates.some((template) => template.category === "cardio");
  const cardioBudget = Math.max(
    0,
    profile.cardio.sessionsPerWeek.max - (hasDedicatedCardio ? 1 : 0),
  );
  let cardioSessions = 0;

  const days = templates.map((template, dayIndex) => {
    const allowCardio = template.category !== "cardio" && cardioSessions < cardioBudget;
    const day = buildDay(
      dayIndex,
      // En 4 días, A y B del mismo bloque comparten índice de variante.
      request.daysPerWeek === 4 ? Math.floor(dayIndex / 2) : dayIndex,
      template,
      request,
      profile,
      catalog,
      warnings,
      allowCardio,
    );

    if (
      template.category === "cardio" ||
      day.exercises.some((item) => item.prescription.kind === "cardio")
    ) {
      cardioSessions += 1;
    }

    return day;
  });

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
  variantIndex: number,
  template: DayTemplate,
  request: PlanRequest,
  profile: EffectiveProfile,
  catalog: readonly CandidateExercise[],
  warnings: PlanWarning[],
  allowCardio: boolean,
): PlanDay {
  const budgetSeconds = Math.max(
    0,
    (request.sessionMinutes - WARMUP_MINUTES - COOLDOWN_MINUTES) * 60,
  );
  const pool = catalog.filter((exercise) => isExerciseAvailable(exercise, request));

  const exercises =
    template.category === "cardio"
      ? buildCardioDay(pool, request, profile, budgetSeconds, warnings)
      : buildStrengthDay(
          pool,
          request,
          profile,
          budgetSeconds,
          template,
          variantIndex,
          warnings,
          allowCardio,
        );

  const day: PlanDay = {
    dayIndex,
    category: template.category,
    isRest: false,
    exercises,
  };
  const workMinutes = estimateDayWorkMinutes(day);

  if (workMinutes < MIN_WORK_MINUTES) {
    warnings.push({ code: "session_too_short", detail: String(dayIndex + 1) });
  }

  return day;
}

function buildStrengthDay(
  pool: readonly CandidateExercise[],
  request: PlanRequest,
  profile: EffectiveProfile,
  budgetSeconds: number,
  template: DayTemplate,
  variantIndex: number,
  warnings: PlanWarning[],
  allowCardio: boolean,
): PlanExercisePrescription[] {
  const exercises: PlanExercisePrescription[] = [];
  const used = new Set<string>();
  let usedSeconds = 0;

  for (const slot of template.slots) {
    if (exercises.length >= MAX_EXERCISES_PER_DAY) break;

    const exercise = pickExercise(slot, pool, used, request.level, variantIndex);

    if (!exercise) {
      warnings.push({ code: "missing_pattern", detail: slot.pattern });

      continue;
    }

    const prescription = fitPrescription(exercise, profile, budgetSeconds - usedSeconds);

    if (!prescription) continue;

    exercises.push({ exerciseSlug: exercise.slug, prescription });
    used.add(exercise.slug);
    usedSeconds += prescriptionSeconds(prescription);
  }

  const cardio = allowCardio ? pickCardio(pool, used, request.level, variantIndex) : null;
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
  const exercise = pickCardio(pool, new Set(), request.level, 0);

  if (!exercise) {
    warnings.push({ code: "missing_pattern", detail: "cardio" });

    return [];
  }

  const minutes = Math.min(40, Math.floor(budgetSeconds / 60));

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

function fitPrescription(
  exercise: CandidateExercise,
  profile: EffectiveProfile,
  remainingSeconds: number,
): PlanExercisePrescription["prescription"] | null {
  if (exercise.measure === "seconds") {
    const seconds = profile.isometricSeconds;
    const restSeconds = Math.min(profile.restSeconds.min, 45);

    for (const sets of [profile.sets.max, profile.sets.min]) {
      const cost = sets * (seconds.max + restSeconds);

      if (cost <= remainingSeconds) {
        return { kind: "isometric", sets, seconds, restSeconds };
      }
    }

    return null;
  }

  const reps = profile.reps;
  const restSeconds = profile.restSeconds.max;

  for (const sets of [profile.sets.max, profile.sets.min]) {
    const cost = sets * (reps.max * SECONDS_PER_REP + restSeconds);

    if (cost <= remainingSeconds) {
      return { kind: "strength", sets, reps, rir: profile.rir.max, restSeconds };
    }
  }

  return null;
}

function pickExercise(
  slot: DaySlot,
  pool: readonly CandidateExercise[],
  used: ReadonlySet<string>,
  level: ExerciseLevel,
  dayIndex: number,
): CandidateExercise | null {
  const candidates = pool.filter(
    (exercise) => exercise.equivalenceGroup === slot.pattern && !used.has(exercise.slug),
  );

  const focused = candidates.filter((exercise) =>
    exercise.primaryMuscles.some((muscle) => slot.focus.includes(muscle)),
  );
  const poolForSlot = focused.length > 0 ? focused : candidates;

  const ranked = [...poolForSlot].sort(
    (a, b) =>
      levelScore(a.level, level) - levelScore(b.level, level) || a.slug.localeCompare(b.slug),
  );
  const best = ranked[0];

  if (!best) return null;

  const bestScore = levelScore(best.level, level);
  const tier = ranked.filter((exercise) => levelScore(exercise.level, level) === bestScore);

  return tier[dayIndex % tier.length] ?? best;
}

function pickCardio(
  pool: readonly CandidateExercise[],
  used: ReadonlySet<string>,
  level: ExerciseLevel,
  dayIndex: number,
): CandidateExercise | null {
  return pickExercise({ pattern: "cardio", focus: [] }, pool, used, level, dayIndex);
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

  // En un gimnasio hay espacio y equipo: valen los ejercicios de casa.
  if (place === "gym" && exercise.place === "home") return true;

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
    return prescription.sets * (prescription.reps.max * SECONDS_PER_REP + prescription.restSeconds);
  }

  if (prescription.kind === "isometric") {
    return prescription.sets * (prescription.seconds.max + prescription.restSeconds);
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
