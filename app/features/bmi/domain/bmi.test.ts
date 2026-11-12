import { describe, expect, it } from "vitest";

import { calculateBmi, classifyBmi, healthyWeightRange, intermediateGoal } from "./bmi";

describe("calculateBmi", () => {
  it("calcula el IMC de 70 kg y 170 cm", () => {
    expect(calculateBmi(70, 170)).toBeCloseTo(24.22, 1);
  });

  it("rechaza estaturas y pesos fuera de rango", () => {
    expect(() => calculateBmi(70, 100)).toThrow(RangeError);
    expect(() => calculateBmi(20, 170)).toThrow(RangeError);
    expect(() => calculateBmi(Number.NaN, 170)).toThrow(RangeError);
  });
});

describe("classifyBmi", () => {
  it("respeta los cortes de la OMS", () => {
    expect(classifyBmi(18.4)).toBe("underweight");
    expect(classifyBmi(18.5)).toBe("normal");
    expect(classifyBmi(24.9)).toBe("normal");
    expect(classifyBmi(25)).toBe("overweight");
    expect(classifyBmi(29.9)).toBe("overweight");
    expect(classifyBmi(30)).toBe("obesity");
  });
});

describe("healthyWeightRange", () => {
  it("da el rango para 170 cm", () => {
    expect(healthyWeightRange(170)).toEqual({ minKg: 53.5, maxKg: 72 });
  });

  it("crece con la estatura", () => {
    const low = healthyWeightRange(150);
    const high = healthyWeightRange(200);

    expect(high.minKg).toBeGreaterThan(low.minKg);
    expect(high.maxKg).toBeGreaterThan(low.maxKg);
  });
});

describe("intermediateGoal", () => {
  it("no sugiere bajar si ya está en rango normal", () => {
    expect(intermediateGoal(70, 170)).toBeNull();
  });

  it("propone un primer paso del 5 % cuando está muy por encima", () => {
    expect(intermediateGoal(90, 170)).toEqual({ targetKg: 85.5, direction: "lose" });
  });

  it("no baja del límite superior saludable", () => {
    expect(intermediateGoal(75, 170)).toEqual({ targetKg: 72, direction: "lose" });
  });

  it("con bajo peso propone llegar al límite inferior", () => {
    expect(intermediateGoal(50, 170)).toEqual({ targetKg: 53.5, direction: "gain" });
  });
});
