import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("acepta rutas internas", () => {
    expect(safeRedirectPath("/cuenta", "/")).toBe("/cuenta");
  });

  it("descarta URLs absolutas y protocol-relative", () => {
    expect(safeRedirectPath("https://evil.com", "/")).toBe("/");
    expect(safeRedirectPath("//evil.com", "/")).toBe("/");
  });

  it("descarta valores vacíos, nulos o no string", () => {
    expect(safeRedirectPath(null, "/")).toBe("/");
    expect(safeRedirectPath("", "/")).toBe("/");
    expect(safeRedirectPath(42, "/")).toBe("/");
  });

  it("descarta barras invertidas y caracteres de control", () => {
    expect(safeRedirectPath("/\\evil.com", "/")).toBe("/");
    expect(safeRedirectPath("/cuenta\n", "/")).toBe("/");
  });
});
