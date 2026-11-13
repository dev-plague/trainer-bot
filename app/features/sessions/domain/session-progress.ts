import type { PlanExercisePrescription } from "~/features/plans";

export type Prescription = PlanExercisePrescription["prescription"];

/** Series que cuenta una prescripción: el cardio se registra como una sola unidad. */
export function totalSetsFor(prescription: Prescription): number {
  return prescription.kind === "cardio" ? 1 : prescription.sets;
}

/** Segundos de descanso que prescribe el ejercicio; 0 si no aplica. */
export function restSecondsFor(prescription: Prescription): number {
  return prescription.kind === "strength" || prescription.kind === "isometric"
    ? prescription.restSeconds
    : 0;
}

export type SetProgress = {
  setsDone: number;
  totalSets: number;
  currentSet: number;
  remainingSets: number;
  isLastSet: boolean;
  isComplete: boolean;
};

/** Estado de serie a partir de lo persistido, sin salirse del rango. */
export function setProgress(setsDone: number, totalSets: number): SetProgress {
  const total = Math.max(1, totalSets);
  const done = Math.min(total, Math.max(0, setsDone));

  return {
    setsDone: done,
    totalSets: total,
    currentSet: Math.min(done + 1, total),
    remainingSets: total - done,
    isLastSet: done === total - 1,
    isComplete: done >= total,
  };
}

export type SetStep = {
  setsDone: number;
  totalSets: number;
  exerciseDone: boolean;
};

/** Avanza una serie; la última marca el ejercicio como terminado. */
export function completeSetStep(setsDone: number, totalSets: number): SetStep {
  const progress = setProgress(setsDone, totalSets);
  const next = Math.min(progress.totalSets, progress.setsDone + 1);

  return {
    setsDone: next,
    totalSets: progress.totalSets,
    exerciseDone: next >= progress.totalSets,
  };
}

export type RestTimer = {
  startedAt: number;
  endsAt: number;
  durationSeconds: number;
};

/**
 * El descanso se calcula desde la marca de tiempo de inicio. Así sigue siendo
 * exacto aunque la pestaña se bloquee o quede en segundo plano.
 */
export function startRestTimer(startedAt: number, seconds: number): RestTimer | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  return {
    startedAt,
    endsAt: startedAt + Math.round(seconds) * 1000,
    durationSeconds: Math.round(seconds),
  };
}

export function restRemainingSeconds(timer: RestTimer, now: number): number {
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
}

/** 0 al empezar, 1 al terminar; sirve para la barra del descanso. */
export function restElapsedRatio(timer: RestTimer, now: number): number {
  if (timer.durationSeconds <= 0) return 1;

  const elapsed = (now - timer.startedAt) / 1000;

  return Math.min(1, Math.max(0, elapsed / timer.durationSeconds));
}

export function isRestOver(timer: RestTimer, now: number): boolean {
  return now >= timer.endsAt;
}

/** Formato m:ss para temporizadores; nunca muestra segundos negativos. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export type SessionProgress = {
  doneUnits: number;
  totalUnits: number;
  percent: number;
};

type ProgressExercise = {
  prescription: Prescription;
  setsDone: number;
  status: "pending" | "done" | "skipped";
};

/**
 * Avance real de la sesión en series. La serie en curso cuenta como avance
 * para que la barra nunca marque 0 mientras la persona ya está entrenando.
 */
export function sessionProgress(
  exercises: readonly ProgressExercise[],
  currentIndex: number | null,
): SessionProgress {
  let doneUnits = 0;
  let totalUnits = 0;

  exercises.forEach((exercise, index) => {
    const units = totalSetsFor(exercise.prescription);

    totalUnits += units;
    doneUnits +=
      exercise.status === "done" ? units : Math.min(Math.max(0, exercise.setsDone), units);

    if (index === currentIndex && exercise.status === "pending" && exercise.setsDone < units) {
      doneUnits += 1;
    }
  });

  const allDone =
    exercises.length > 0 &&
    exercises.every((exercise) => exercise.status === "done" || exercise.status === "skipped");
  const rawPercent = totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100);

  return {
    doneUnits,
    totalUnits,
    percent: allDone ? 100 : Math.min(99, rawPercent),
  };
}
