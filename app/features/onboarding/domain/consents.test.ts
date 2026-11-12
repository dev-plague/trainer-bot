import { describe, expect, it } from "vitest";

import { CONSENT_VERSION, missingConsents } from "./consents";

describe("missingConsents", () => {
  it("devuelve los dos consentimientos cuando no hay ninguno", () => {
    expect(missingConsents([])).toEqual(["safety_notice", "health_data"]);
  });

  it("no pide el que ya está aceptado en la versión vigente", () => {
    expect(missingConsents([{ kind: "safety_notice", version: CONSENT_VERSION }])).toEqual([
      "health_data",
    ]);
  });

  it("vuelve a pedir los textos si cambió la versión", () => {
    const vieja = [
      { kind: "safety_notice", version: "v0" },
      { kind: "health_data", version: "v0" },
    ];

    expect(missingConsents(vieja)).toEqual(["safety_notice", "health_data"]);
  });

  it("devuelve una lista vacía cuando están los dos", () => {
    const vigentes = [
      { kind: "safety_notice", version: CONSENT_VERSION },
      { kind: "health_data", version: CONSENT_VERSION },
    ];

    expect(missingConsents(vigentes)).toEqual([]);
  });
});
