import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./schemas";

describe("signUpSchema", () => {
  it("normaliza el correo y el nombre", () => {
    const result = signUpSchema.parse({
      name: "  Ana  ",
      email: "  ANA@Example.COM ",
      password: "contrasena-larga",
    });

    expect(result.name).toBe("Ana");
    expect(result.email).toBe("ana@example.com");
  });

  it("rechaza contraseñas de menos de 8 caracteres", () => {
    const result = signUpSchema.safeParse({
      name: "Ana",
      email: "ana@example.com",
      password: "corta",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("8");
  });

  it("rechaza un correo inválido", () => {
    const result = signUpSchema.safeParse({
      name: "Ana",
      email: "no-es-correo",
      password: "contrasena-larga",
    });

    expect(result.success).toBe(false);
  });

  it("exige un nombre", () => {
    const result = signUpSchema.safeParse({
      name: "   ",
      email: "ana@example.com",
      password: "contrasena-larga",
    });

    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("acepta credenciales con forma válida", () => {
    expect(signInSchema.safeParse({ email: "ana@example.com", password: "x" }).success).toBe(true);
  });
});
