import type { EquivalenceGroup } from "~/features/exercises/domain/exercise-seed";
import type { MuscleGroup } from "~/features/exercises/domain/muscles";
import type { PlanDayCategory } from "./contract";

export type DaySlot = {
  pattern: EquivalenceGroup;
  /** Grupos que debería tocar este hueco; solo ordena candidatos. */
  focus: readonly MuscleGroup[];
};

export type DayTemplate = {
  category: PlanDayCategory;
  slots: readonly DaySlot[];
};

const slot = (pattern: EquivalenceGroup, focus: readonly MuscleGroup[]): DaySlot => ({
  pattern,
  focus,
});

const fullBodyA: DayTemplate = {
  category: "full_body",
  slots: [
    slot("squat", ["quads", "glutes"]),
    slot("push", ["chest", "triceps"]),
    slot("pull", ["back", "biceps"]),
    slot("hinge", ["glutes", "hamstrings"]),
    slot("core", ["core"]),
  ],
};

const fullBodyB: DayTemplate = {
  category: "full_body",
  slots: [
    slot("lunge", ["quads", "glutes"]),
    slot("push", ["shoulders", "triceps"]),
    slot("pull", ["back"]),
    slot("hinge", ["glutes"]),
    slot("core", ["core"]),
  ],
};

const pushQuads: DayTemplate = {
  category: "push_quads",
  slots: [
    slot("squat", ["quads", "glutes"]),
    slot("push", ["chest", "triceps"]),
    slot("lunge", ["quads", "glutes"]),
    slot("push", ["shoulders", "triceps"]),
    slot("push", ["triceps"]),
    slot("core", ["core"]),
  ],
};

const pullPosterior: DayTemplate = {
  category: "pull_posterior",
  slots: [
    slot("hinge", ["hamstrings", "glutes"]),
    slot("pull", ["back", "biceps"]),
    slot("pull", ["back"]),
    slot("hinge", ["glutes"]),
    slot("pull", ["back", "shoulders"]),
    slot("core", ["core"]),
  ],
};

const legsShouldersCore: DayTemplate = {
  category: "legs_shoulders_core",
  slots: [
    slot("lunge", ["quads", "glutes"]),
    slot("squat", ["quads", "glutes"]),
    slot("push", ["shoulders"]),
    slot("push", ["chest"]),
    slot("pull", ["biceps"]),
    slot("calves", ["calves"]),
    slot("core", ["core"]),
  ],
};

const upperA: DayTemplate = {
  category: "upper",
  slots: [
    slot("push", ["chest"]),
    slot("pull", ["back"]),
    slot("push", ["shoulders"]),
    slot("pull", ["biceps"]),
    slot("core", ["core"]),
  ],
};

const lowerA: DayTemplate = {
  category: "lower",
  slots: [
    slot("squat", ["quads", "glutes"]),
    slot("hinge", ["hamstrings", "glutes"]),
    slot("lunge", ["quads", "glutes"]),
    slot("calves", ["calves"]),
    slot("core", ["core"]),
  ],
};

const upperB: DayTemplate = {
  category: "upper",
  slots: [
    slot("push", ["shoulders"]),
    slot("pull", ["back"]),
    slot("push", ["triceps"]),
    slot("pull", ["biceps"]),
    slot("core", ["core"]),
  ],
};

const lowerB: DayTemplate = {
  category: "lower",
  slots: [
    slot("squat", ["glutes", "quads"]),
    slot("hinge", ["glutes"]),
    slot("lunge", ["quads"]),
    slot("calves", ["calves"]),
    slot("core", ["core"]),
  ],
};

const cardioDay: DayTemplate = { category: "cardio", slots: [] };

export function templatesForDays(days: number): DayTemplate[] {
  if (days <= 2) return [fullBodyA, fullBodyB];

  if (days === 3) return [pushQuads, pullPosterior, legsShouldersCore];

  if (days === 4) return [upperA, lowerA, upperB, lowerB];

  return [pushQuads, pullPosterior, legsShouldersCore, upperA, cardioDay];
}

/** Grupos que el día quiere atacar. Se usa para el modo flexible. */
export function categoryFocus(category: PlanDayCategory): readonly MuscleGroup[] {
  switch (category) {
    case "full_body":
      return [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "core",
      ];
    case "upper":
      return ["chest", "back", "shoulders", "biceps", "triceps", "core"];
    case "lower":
      return ["quads", "hamstrings", "glutes", "calves", "core"];
    case "push_quads":
      return ["chest", "shoulders", "triceps", "quads", "glutes", "core"];
    case "pull_posterior":
      return ["back", "biceps", "glutes", "hamstrings", "core"];
    case "legs_shoulders_core":
      return ["quads", "glutes", "hamstrings", "calves", "shoulders", "chest", "core"];
    case "cardio":
      return ["quads", "glutes", "hamstrings", "calves", "core"];
  }
}
