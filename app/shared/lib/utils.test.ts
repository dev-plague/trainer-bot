import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("resuelve conflictos de clases quedándose con la última", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("text-sm", false, undefined, null, "font-medium")).toBe("text-sm font-medium");
  });
});
