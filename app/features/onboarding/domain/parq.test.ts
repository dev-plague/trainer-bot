import { describe, expect, it } from "vitest";

import { healthText } from "~/content/health";
import { needsMedicalClearance, parqFormSchema, toAnswers } from "./parq";

const allNo = {
  heart_condition: "no",
  chest_pain: "no",
  dizziness: "no",
  bone_joint: "no",
  blood_pressure_meds: "no",
  pregnancy: "no",
  other_reason: "no",
} as const;

describe("parqFormSchema", () => {
  it("acepta un cuestionario completo", () => {
    expect(parqFormSchema.safeParse(allNo).success).toBe(true);
  });

  it("rechaza un cuestionario incompleto", () => {
    const { chest_pain: _omitida, ...incompleto } = allNo;

    expect(parqFormSchema.safeParse(incompleto).success).toBe(false);
  });

  it("rechaza valores que no son sí/no", () => {
    expect(parqFormSchema.safeParse({ ...allNo, chest_pain: "tal vez" }).success).toBe(false);
  });
});

describe("toAnswers", () => {
  it("convierte sí/no en booleanos", () => {
    const answers = toAnswers({ ...allNo, dizziness: "yes" });

    expect(answers.dizziness).toBe(true);
    expect(answers.heart_condition).toBe(false);
  });
});

describe("needsMedicalClearance", () => {
  it("es falso cuando todo es «no»", () => {
    expect(needsMedicalClearance(toAnswers(allNo))).toBe(false);
  });

  it("es verdadero con una sola respuesta de riesgo", () => {
    expect(needsMedicalClearance(toAnswers({ ...allNo, pregnancy: "yes" }))).toBe(true);
  });
});

describe("textos del cuestionario", () => {
  it("tiene una pregunta por cada id", () => {
    expect(Object.keys(healthText.questions)).toHaveLength(7);
  });
});
