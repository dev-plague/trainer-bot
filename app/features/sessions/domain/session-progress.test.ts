import { describe, expect, it } from "vitest";

import {
  completeSetStep,
  formatClock,
  isRestOver,
  restElapsedRatio,
  restRemainingSeconds,
  restSecondsFor,
  sessionProgress,
  setProgress,
  startRestTimer,
  totalSetsFor,
} from "./session-progress";

const strength = {
  kind: "strength",
  sets: 2,
  reps: { min: 8, max: 12 },
  rir: 3,
  restSeconds: 90,
} as const;

const isometric = {
  kind: "isometric",
  sets: 2,
  seconds: { min: 20, max: 45 },
  restSeconds: 45,
} as const;

const cardio = {
  kind: "cardio",
  minutes: 20,
  intensity: "moderate",
} as const;

const mobility = {
  kind: "mobility",
  sets: 2,
  seconds: { min: 60, max: 60 },
  restSeconds: 15,
} as const;

function restTimer(seconds: number, startedAt = 0) {
  const timer = startRestTimer(startedAt, seconds);

  if (!timer) throw new Error("El temporizador de prueba no se creó");

  return timer;
}

describe("setProgress", () => {
  it("empieza en la serie 1 y no retrocede si el valor guardado es inválido", () => {
    expect(setProgress(-3, 2)).toMatchObject({
      setsDone: 0,
      currentSet: 1,
      isLastSet: false,
      isComplete: false,
    });
  });

  it("señala la última serie", () => {
    expect(setProgress(1, 2)).toMatchObject({
      currentSet: 2,
      remainingSets: 1,
      isLastSet: true,
      isComplete: false,
    });
  });

  it("no pasa del total aunque haya datos viejos", () => {
    expect(setProgress(9, 2)).toMatchObject({ setsDone: 2, isComplete: true });
  });

  it("trata el cardio como una sola unidad", () => {
    expect(totalSetsFor(cardio)).toBe(1);
    expect(totalSetsFor(strength)).toBe(2);
    expect(setProgress(0, totalSetsFor(cardio)).isLastSet).toBe(true);
  });

  it("cuenta las series de movilidad y su descanso", () => {
    expect(totalSetsFor(mobility)).toBe(2);
    expect(restSecondsFor(mobility)).toBe(15);
  });
});

describe("completeSetStep", () => {
  it("avanza una serie sin terminar el ejercicio", () => {
    expect(completeSetStep(0, 2)).toEqual({ setsDone: 1, totalSets: 2, exerciseDone: false });
  });

  it("marca el ejercicio al completar la última serie", () => {
    expect(completeSetStep(1, 2)).toEqual({ setsDone: 2, totalSets: 2, exerciseDone: true });
  });
});

describe("temporizador de descanso", () => {
  it("calcula el final desde la marca de inicio", () => {
    expect(startRestTimer(1_000, 90)).toEqual({
      startedAt: 1_000,
      endsAt: 91_000,
      durationSeconds: 90,
    });
  });

  it("no crea temporizador sin descanso", () => {
    expect(startRestTimer(1_000, 0)).toBeNull();
    expect(startRestTimer(1_000, Number.NaN)).toBeNull();
  });

  it("sigue siendo exacto si el intervalo se retrasa", () => {
    const rest = restTimer(90, 1_000);

    expect(restRemainingSeconds(rest, 1_000)).toBe(90);
    expect(restRemainingSeconds(rest, 46_000)).toBe(45);
    expect(restRemainingSeconds(rest, 95_000)).toBe(0);
  });

  it("describe el avance del descanso entre 0 y 1", () => {
    const rest = restTimer(100);

    expect(restElapsedRatio(rest, 0)).toBe(0);
    expect(restElapsedRatio(rest, 50_000)).toBe(0.5);
    expect(restElapsedRatio(rest, 150_000)).toBe(1);
  });

  it("sabe cuándo termina", () => {
    const rest = restTimer(30);

    expect(isRestOver(rest, 29_999)).toBe(false);
    expect(isRestOver(rest, 30_000)).toBe(true);
  });

  it("formatea el reloj en m:ss", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(5)).toBe("0:05");
    expect(formatClock(-4)).toBe("0:00");
  });
});

describe("sessionProgress", () => {
  it("cuenta la serie en curso como avance real", () => {
    const exercises = [
      { prescription: strength, setsDone: 0, status: "pending" as const },
      { prescription: isometric, setsDone: 0, status: "pending" as const },
    ];

    expect(sessionProgress(exercises, 0)).toEqual({ doneUnits: 1, totalUnits: 4, percent: 25 });
  });

  it("suma las series hechas y las de ejercicios completados", () => {
    const exercises = [
      { prescription: strength, setsDone: 2, status: "done" as const },
      { prescription: strength, setsDone: 1, status: "pending" as const },
    ];

    expect(sessionProgress(exercises, 1)).toEqual({ doneUnits: 4, totalUnits: 4, percent: 99 });
  });

  it("llega a 100 solo cuando el último ejercicio está hecho", () => {
    const exercises = [{ prescription: strength, setsDone: 2, status: "done" as const }];

    expect(sessionProgress(exercises, null)).toEqual({
      doneUnits: 2,
      totalUnits: 2,
      percent: 100,
    });
  });

  it("cuenta los ejercicios viejos completados sin series registradas", () => {
    const exercises = [{ prescription: strength, setsDone: 0, status: "done" as const }];

    expect(sessionProgress(exercises, null)).toEqual({
      doneUnits: 2,
      totalUnits: 2,
      percent: 100,
    });
  });
});
