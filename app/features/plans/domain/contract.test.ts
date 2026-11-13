import { describe, expect, it } from "vitest";

import { ENGINE_VERSION, planRequestSchema } from "./contract";

const valid = {
  goal: "general_health",
  level: "beginner",
  daysPerWeek: 3,
  sessionMinutes: 45,
  place: "home",
  equipment: [],
  limitations: "",
  mode: "strict",
} as const;

describe("planRequestSchema", () => {
  it("acepta una solicitud válida", () => {
    expect(planRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rellena equipo y limitaciones por defecto", () => {
    const { equipment: _equipment, limitations: _limitations, ...rest } = valid;
    const result = planRequestSchema.parse(rest);

    expect(result.equipment).toEqual([]);
    expect(result.limitations).toBe("");
  });

  it("rechaza días fuera de 2-5", () => {
    expect(planRequestSchema.safeParse({ ...valid, daysPerWeek: 1 }).success).toBe(false);
    expect(planRequestSchema.safeParse({ ...valid, daysPerWeek: 6 }).success).toBe(false);
  });

  it("rechaza sesiones de menos de 20 minutos", () => {
    expect(planRequestSchema.safeParse({ ...valid, sessionMinutes: 10 }).success).toBe(false);
  });

  it("rechaza equipo fuera de la lista cerrada", () => {
    expect(planRequestSchema.safeParse({ ...valid, equipment: ["kettlebell"] }).success).toBe(
      false,
    );
  });

  it("rechaza objetivos desconocidos", () => {
    expect(planRequestSchema.safeParse({ ...valid, goal: "mobility" }).success).toBe(false);
  });

  it("tiene una versión de motor no vacía", () => {
    expect(ENGINE_VERSION.length).toBeGreaterThan(0);
  });
});
