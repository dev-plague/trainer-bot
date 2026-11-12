import { describe, expect, it } from "vitest";

import { calculateAge, isAdult, parseBirthDate } from "./age";

describe("calculateAge", () => {
  it("cuenta los años cumplidos antes del cumpleaños", () => {
    expect(calculateAge("2008-11-13", new Date("2026-11-12T12:00:00Z"))).toBe(17);
  });

  it("cuenta el año el mismo día del cumpleaños", () => {
    expect(calculateAge("2008-11-12", new Date("2026-11-12T00:00:00Z"))).toBe(18);
  });

  it("maneja el 29 de febrero", () => {
    expect(calculateAge("2008-02-29", new Date("2026-02-28T00:00:00Z"))).toBe(17);
    expect(calculateAge("2008-02-29", new Date("2026-03-01T00:00:00Z"))).toBe(18);
  });

  it("devuelve null con una fecha imposible", () => {
    expect(calculateAge("2020-02-31")).toBeNull();
    expect(calculateAge("no-es-fecha")).toBeNull();
  });
});

describe("parseBirthDate", () => {
  it("acepta una fecha real", () => {
    expect(parseBirthDate("1995-04-30")?.toISOString()).toBe("1995-04-30T00:00:00.000Z");
  });

  it("rechaza fechas que se desbordan al mes siguiente", () => {
    expect(parseBirthDate("2020-04-31")).toBeNull();
  });
});

describe("isAdult", () => {
  const today = new Date("2026-11-12T00:00:00Z");

  it("acepta a quien cumple 18 hoy", () => {
    expect(isAdult("2008-11-12", today)).toBe(true);
  });

  it("rechaza a quien cumple 18 mañana", () => {
    expect(isAdult("2008-11-13", today)).toBe(false);
  });
});
