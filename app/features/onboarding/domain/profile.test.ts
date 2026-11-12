import { describe, expect, it } from "vitest";

import { profileDetailsSchema, profileSetupSchema } from "./profile";

describe("profileSetupSchema", () => {
  it("recorta el nombre preferido", () => {
    const result = profileSetupSchema.parse({
      preferredName: "  Ani  ",
      addressForm: "feminine",
    });

    expect(result.preferredName).toBe("Ani");
  });

  it("usa trato neutro cuando no se envía", () => {
    const result = profileSetupSchema.parse({ preferredName: "Ani" });

    expect(result.addressForm).toBe("neutral");
  });

  it("rechaza un nombre vacío", () => {
    expect(profileSetupSchema.safeParse({ preferredName: "   " }).success).toBe(false);
  });

  it("rechaza nombres de más de 40 caracteres", () => {
    const result = profileSetupSchema.safeParse({ preferredName: "a".repeat(41) });

    expect(result.success).toBe(false);
  });

  it("rechaza una forma de trato desconocida", () => {
    const result = profileSetupSchema.safeParse({
      preferredName: "Ani",
      addressForm: "otra",
    });

    expect(result.success).toBe(false);
  });
});

describe("profileDetailsSchema", () => {
  it("acepta un perfil válido sin peso", () => {
    const result = profileDetailsSchema.parse({
      birthDate: "1995-04-30",
      heightCm: "170",
      weightKg: "",
    });

    expect(result.heightCm).toBe(170);
    expect(result.weightKg).toBeUndefined();
  });

  it("acepta el peso con decimales", () => {
    const result = profileDetailsSchema.parse({
      birthDate: "1995-04-30",
      heightCm: "170",
      weightKg: "70.5",
    });

    expect(result.weightKg).toBe(70.5);
  });

  it("rechaza estatura fuera de rango", () => {
    expect(
      profileDetailsSchema.safeParse({ birthDate: "1995-04-30", heightCm: "80" }).success,
    ).toBe(false);
  });

  it("rechaza una fecha imposible", () => {
    expect(
      profileDetailsSchema.safeParse({ birthDate: "2020-02-31", heightCm: "170" }).success,
    ).toBe(false);
  });

  it("rechaza peso fuera de rango", () => {
    expect(
      profileDetailsSchema.safeParse({
        birthDate: "1995-04-30",
        heightCm: "170",
        weightKg: "500",
      }).success,
    ).toBe(false);
  });
});
