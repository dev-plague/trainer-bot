import { describe, expect, it } from "vitest";

import { validateSeed } from "./exercise-seed";

const base = {
  slug: "sentadilla-al-cuerpo",
  name: "Sentadilla al cuerpo",
  primaryMuscles: ["Cuádriceps"],
  place: "home",
  level: "beginner",
  tips: ["Baja con la espalda recta."],
  equivalenceGroup: "squat",
  source: "ACSM",
} as const;

describe("validateSeed", () => {
  it("acepta un seed mínimo válido y rellena opcionales", () => {
    const { exercises, byGroup } = validateSeed([base]);

    expect(exercises[0]?.equipment).toEqual([]);
    expect(exercises[0]?.isComplex).toBe(false);
    expect(byGroup.get("squat")).toHaveLength(1);
  });

  it("rechaza un ejercicio sin fuente", () => {
    const { source: _omitida, ...sinFuente } = base;

    expect(() => validateSeed([sinFuente])).toThrow(/necesita una fuente/);
  });

  it("rechaza slugs duplicados", () => {
    expect(() => validateSeed([base, { ...base, name: "Otra" }])).toThrow(/Slug duplicado/);
  });

  it("rechaza un complejo sin regresión", () => {
    expect(() => validateSeed([{ ...base, isComplex: true }])).toThrow(/necesita una regresión/);
  });

  it("rechaza una regresión que no existe en el seed", () => {
    expect(() => validateSeed([{ ...base, regressionSlug: "no-existe" }])).toThrow(
      /Regresión inexistente/,
    );
  });

  it("rechaza un grupo de equivalencia desconocido", () => {
    expect(() => validateSeed([{ ...base, equivalenceGroup: "otro" }])).toThrow(
      /Ejercicio #1 inválido/,
    );
  });

  it("agrupa por equivalencia", () => {
    const { byGroup } = validateSeed([
      base,
      { ...base, slug: "sentadilla-con-mancuerna", name: "Sentadilla con mancuerna" },
      { ...base, slug: "plancha", name: "Plancha", equivalenceGroup: "core" },
    ]);

    expect(byGroup.get("squat")).toHaveLength(2);
    expect(byGroup.get("core")).toHaveLength(1);
  });
});
