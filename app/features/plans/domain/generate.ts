import type { Equipment } from "~/features/exercises/domain/equipment";
import type {
  EquivalenceGroup,
  ExerciseLevel,
  ExercisePlace,
  MobilityPhase,
} from "~/features/exercises/domain/exercise-seed";
import {
  type BodyRegion,
  bodyRegionOfMuscle,
  type ExerciseMeasure,
  type MuscleGroup,
} from "~/features/exercises/domain/muscles";
import {
  ENGINE_VERSION,
  type GeneratedPlan,
  type PlanDay,
  type PlanExercisePrescription,
  type PlanRequest,
  type PlanWarning,
} from "./contract";
import { type EffectiveProfile, profileFor } from "./profiles";
import { categoryFocus, type DaySlot, type DayTemplate, templatesForDays } from "./templates";

/** Lo mínimo que el motor necesita de un ejercicio. Sin base de datos. */
export type CandidateExercise = {
  slug: string;
  place: ExercisePlace;
  level: ExerciseLevel;
  equipment: Equipment[];
  equivalenceGroup: EquivalenceGroup;
  mobilityPhase: MobilityPhase | null;
  primaryMuscles: MuscleGroup[];
  measure: ExerciseMeasure;
  contraindications: string[];
  isComplex: boolean;
};

export const WARMUP_MINUTES = 5;
export const COOLDOWN_MINUTES = 5;
const MOBILITY_STEPS_PER_BLOCK = 2;
const MOBILITY_SETS = 2;
const MOBILITY_SECONDS = 60;
const MOBILITY_REST_SECONDS = 15;

/**
 * Orden de preferencia dentro de cada tren: cadera y tobillo para calentar
 * pierna; hombro y columna para calentar torso; isquiotibiales y gemelos para
 * enfriar pierna; pecho y espalda para enfriar torso.
 */
const MOBILITY_PRIORITY: Record<MobilityPhase, Record<BodyRegion, readonly MuscleGroup[]>> = {
  warmup: {
    lower: ["glutes", "calves"],
    upper: ["shoulders", "back"],
  },
  cooldown: {
    lower: ["hamstrings", "calves"],
    upper: ["chest", "back"],
  },
};
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
  const pool = catalog.filter((exercise) => isExerciseAvailable(exercise, request));
  const warmup = buildMobilityBlock("warmup", template, pool, warnings);
  const cooldown = buildMobilityBlock("cooldown", template, pool, warnings);
  const mobilitySeconds = [...warmup, ...cooldown].reduce(
    (total, item) => total + prescriptionSeconds(item.prescription),
    0,
  );
  // El calentamiento y el enfriamiento se eligen primero: si no cabe el trabajo
  // principal, se recortan ejercicios principales, nunca la movilidad.
  const budgetSeconds = Math.max(0, request.sessionMinutes * 60 - mobilitySeconds);

  const main =
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
    exercises: [...warmup, ...main, ...cooldown],
  };

  if (estimateMainWorkMinutes(day) < MIN_WORK_MINUTES) {
    warnings.push({ code: "session_too_short", detail: String(dayIndex + 1) });
  }

  return day;
}

/**
 * Dos pasos de movilidad por bloque, elegidos por el foco del día: un día de
 * pierna calienta cadera y tobillo; uno de torso, hombro y columna torácica.
 */
function buildMobilityBlock(
  phase: MobilityPhase,
  template: DayTemplate,
  pool: readonly CandidateExercise[],
  warnings: PlanWarning[],
): PlanExercisePrescription[] {
  const candidates = pool.filter(
    (exercise) => exercise.equivalenceGroup === "mobility" && exercise.mobilityPhase === phase,
  );
  const picked = selectMobility(candidates, categoryFocus(template.category), phase);

  if (picked.length < MOBILITY_STEPS_PER_BLOCK) {
    warnings.push({ code: "missing_mobility", detail: phase });
  }

  return picked.map((exercise) => ({
    exerciseSlug: exercise.slug,
    prescription: {
      kind: "mobility",
      sets: MOBILITY_SETS,
      seconds: { min: MOBILITY_SECONDS, max: MOBILITY_SECONDS },
      restSeconds: MOBILITY_REST_SECONDS,
    },
  }));
}

function selectMobility(
  candidates: readonly CandidateExercise[],
  focus: readonly MuscleGroup[],
  phase: MobilityPhase,
): CandidateExercise[] {
  const ranked = [...candidates].sort(
    (a, b) =>
      focusScore(b, focus) - focusScore(a, focus) ||
      mobilityPriority(a, phase) - mobilityPriority(b, phase) ||
      a.slug.localeCompare(b.slug),
  );
  const selected: CandidateExercise[] = [];
  const used = new Set<string>();

  for (const region of desiredRegions(focus)) {
    const pick =
      ranked.find(
        (exercise) =>
          !used.has(exercise.slug) &&
          regionOf(exercise) === region &&
          matchesFocus(exercise, focus),
      ) ??
      ranked.find((exercise) => !used.has(exercise.slug) && regionOf(exercise) === region) ??
      ranked.find((exercise) => !used.has(exercise.slug));

    if (!pick) break;

    selected.push(pick);
    used.add(pick.slug);
  }

  while (selected.length < MOBILITY_STEPS_PER_BLOCK) {
    const pick = ranked.find((exercise) => !used.has(exercise.slug));

    if (!pick) break;

    selected.push(pick);
    used.add(pick.slug);
  }

  return selected;
}

/** Trenes que el foco del día pide cubrir; un foco mixto pide uno de cada uno. */
function desiredRegions(focus: readonly MuscleGroup[]): (BodyRegion | null)[] {
  const regions = new Set(
    focus.map((muscle) => bodyRegionOfMuscle(muscle)).filter((region) => region !== null),
  );
  const hasLower = regions.has("lower");
  const hasUpper = regions.has("upper");

  if (hasLower && hasUpper) return ["lower", "upper"];
  if (hasLower) return ["lower", "lower"];
  if (hasUpper) return ["upper", "upper"];

  return [null, null];
}

function regionOf(exercise: CandidateExercise): BodyRegion | null {
  for (const muscle of exercise.primaryMuscles) {
    const region = bodyRegionOfMuscle(muscle);

    if (region) return region;
  }

  return null;
}

function matchesFocus(exercise: CandidateExercise, focus: readonly MuscleGroup[]): boolean {
  return exercise.primaryMuscles.some((muscle) => focus.includes(muscle));
}

function focusScore(exercise: CandidateExercise, focus: readonly MuscleGroup[]): number {
  return exercise.primaryMuscles.filter((muscle) => focus.includes(muscle)).length;
}

function mobilityPriority(exercise: CandidateExercise, phase: MobilityPhase): number {
  const { lower, upper } = MOBILITY_PRIORITY[phase];
  const lowerIndex = lower.findIndex((muscle) => exercise.primaryMuscles.includes(muscle));

  if (lowerIndex !== -1) return lowerIndex;

  const upperIndex = upper.findIndex((muscle) => exercise.primaryMuscles.includes(muscle));

  return upperIndex === -1 ? lower.length + upper.length : lower.length + upperIndex;
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

  return prescription.sets * (prescription.seconds.max + prescription.restSeconds);
}

/** Duración prescrita de un paso, en minutos. */
export function estimatePrescriptionMinutes(
  prescription: PlanExercisePrescription["prescription"],
): number {
  return secondsToMinutes(prescriptionSeconds(prescription));
}

/** Tiempo total prescrito del día, incluidos calentamiento y enfriamiento. */
export function estimateDayWorkMinutes(day: PlanDay): number {
  return secondsToMinutes(
    day.exercises.reduce((total, item) => total + prescriptionSeconds(item.prescription), 0),
  );
}

/** Trabajo principal: excluye la movilidad para decidir si la sesión es corta. */
export function estimateMainWorkMinutes(day: PlanDay): number {
  return secondsToMinutes(
    day.exercises
      .filter((item) => item.prescription.kind !== "mobility")
      .reduce((total, item) => total + prescriptionSeconds(item.prescription), 0),
  );
}

function secondsToMinutes(seconds: number): number {
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
