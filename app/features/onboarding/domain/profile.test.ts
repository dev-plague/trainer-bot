import { describe, expect, it } from "vitest";

import { profileSetupSchema } from "./profile";

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
