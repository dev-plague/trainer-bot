import { describe, expect, it } from "vitest";

import { prescriptionDetailText, prescriptionText, rirText } from "./plans";

describe("prescriptionText", () => {
  it("traduce el RIR a lenguaje llano", () => {
    expect(
      prescriptionText({
        kind: "strength",
        sets: 2,
        reps: { min: 10, max: 12 },
        rir: 3,
        restSeconds: 90,
      }),
    ).toBe("2 × 10-12 reps · Deja unas 3 repeticiones sin hacer · 90 s de descanso");
  });

  it("usa singular cuando queda una repetición", () => {
    expect(
      prescriptionText({
        kind: "strength",
        sets: 2,
        reps: { min: 10, max: 12 },
        rir: 1,
        restSeconds: 90,
      }),
    ).toBe("2 × 10-12 reps · Deja 1 repetición sin hacer · 90 s de descanso");
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

    expect(prescriptionText(legacy)).toBe(
      "1 × 13 reps · Deja unas 5 repeticiones sin hacer · 105 s de descanso",
    );
  });
});

describe("rirText", () => {
  it("calcula el texto desde el valor", () => {
    expect(rirText(2)).toBe("Deja unas 2 repeticiones sin hacer");
    expect(rirText(4)).toBe("Deja unas 4 repeticiones sin hacer");
  });

  it("no promete entrenar al fallo si llega un valor viejo en cero", () => {
    expect(rirText(0)).toBe("Deja 1 repetición sin hacer");
  });
});

describe("prescriptionDetailText", () => {
  const shared = {
    kind: "strength",
    sets: 2,
    reps: { min: 8, max: 12 },
    rir: 4,
    restSeconds: 135,
  } as const;

  it("omite lo que ya dice la cabecera del día", () => {
    expect(prescriptionDetailText(shared, shared)).toBeNull();
  });

  it("muestra lo que cambia respecto a la cabecera", () => {
    expect(prescriptionDetailText({ ...shared, sets: 1 }, shared)).toBe(
      "1 × 8-12 reps · Deja unas 4 repeticiones sin hacer · 135 s de descanso",
    );
  });

  it("muestra todo cuando el día no comparte prescripción", () => {
    expect(
      prescriptionDetailText(
        { kind: "isometric", sets: 2, seconds: { min: 20, max: 45 }, restSeconds: 45 },
        null,
      ),
    ).toBe("2 × 20-45 s · 45 s de descanso");
  });
});
