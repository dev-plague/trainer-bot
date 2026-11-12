import { describe, expect, it } from "vitest";

import { greetingPeriod } from "./greeting";

describe("greetingPeriod", () => {
  it("saluda buenas noches de madrugada", () => {
    expect(greetingPeriod(0)).toBe("evening");
    expect(greetingPeriod(4)).toBe("evening");
  });

  it("cambia a buenos días a las 5", () => {
    expect(greetingPeriod(5)).toBe("morning");
  });

  it("cambia a buenas tardes a las 12", () => {
    expect(greetingPeriod(11)).toBe("morning");
    expect(greetingPeriod(12)).toBe("afternoon");
  });

  it("cambia a buenas noches a las 20", () => {
    expect(greetingPeriod(19)).toBe("afternoon");
    expect(greetingPeriod(20)).toBe("evening");
    expect(greetingPeriod(23)).toBe("evening");
  });

  it("rechaza horas fuera de rango o no enteras", () => {
    expect(() => greetingPeriod(24)).toThrow(RangeError);
    expect(() => greetingPeriod(-1)).toThrow(RangeError);
    expect(() => greetingPeriod(12.5)).toThrow(RangeError);
  });
});
