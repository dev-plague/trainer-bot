import { describe, expect, it } from "vitest";

import { prescriptionText } from "./plans";

describe("prescriptionText", () => {
  it("muestra la fuerza con rango de repeticiones", () => {
    expect(
      prescriptionText({
        kind: "strength",
        sets: 2,
        reps: { min: 10, max: 12 },
        rir: 3,
        restSeconds: 90,
      }),
    ).toBe("2 × 10-12 reps · RIR 3 · 90 s de descanso");
  });

  it("muestra los isométricos en segundos", () => {
    expect(
      prescriptionText({
        kind: "isometric",
        sets: 3,
        seconds: { min: 30, max: 45 },
        restSeconds: 30,
      }),
    ).toBe("3 × 30-45 s · 30 s de descanso");
  });

  it("sigue mostrando planes viejos con reps numéricas", () => {
    const legacy = {
      kind: "strength",
      sets: 1,
      reps: 13,
      rir: 5,
      restSeconds: 105,
    } as unknown as Parameters<typeof prescriptionText>[0];

    expect(prescriptionText(legacy)).toBe("1 × 13 reps · RIR 5 · 105 s de descanso");
  });
});
