import { describe, expect, it } from "vitest";

import { guestRedirectTarget, loginRedirectTarget } from "./routing";

describe("guestRedirectTarget", () => {
  it("manda a la app cuando hay sesión", () => {
    expect(guestRedirectTarget(true)).toBe("/plan");
  });

  it("no redirige sin sesión (login y registro accesibles)", () => {
    expect(guestRedirectTarget(false)).toBeNull();
  });

  it("tras cerrar sesión vuelve a permitir las pantallas de autenticación", () => {
    const beforeLogout = guestRedirectTarget(true);
    const afterLogout = guestRedirectTarget(false);

    expect(beforeLogout).toBe("/plan");
    expect(afterLogout).toBeNull();
  });
});

describe("loginRedirectTarget", () => {
  it("conserva una ruta interna", () => {
    expect(loginRedirectTarget("/sesion/abc")).toBe("/entrar?redirectTo=%2Fsesion%2Fabc");
  });

  it("conserva query interna", () => {
    expect(loginRedirectTarget("/plan?nuevo=1")).toBe("/entrar?redirectTo=%2Fplan%3Fnuevo%3D1");
  });

  it("descarta URLs externas", () => {
    expect(loginRedirectTarget("https://evil.com")).toBe("/entrar?redirectTo=%2Fcuenta");
    expect(loginRedirectTarget("//evil.com")).toBe("/entrar?redirectTo=%2Fcuenta");
  });

  it("usa /cuenta cuando no hay ruta", () => {
    expect(loginRedirectTarget("")).toBe("/entrar?redirectTo=%2Fcuenta");
  });
});
