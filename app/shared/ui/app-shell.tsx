import { NavLink, Outlet } from "react-router";

import { cn } from "~/shared/lib/utils";
import { AccountIcon, BmiIcon, PlanIcon, SettingsIcon } from "./icons";
import { BrandMark } from "./page-header";

const NAV_ITEMS = [
  { to: "/plan", label: "Plan", Icon: PlanIcon },
  { to: "/imc", label: "IMC", Icon: BmiIcon },
  { to: "/cuenta", label: "Cuenta", Icon: AccountIcon },
];

export default function AppShell() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 hidden border-b border-border/70 bg-background/85 backdrop-blur md:block">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <NavLink to="/plan" className="flex items-center gap-3">
            <BrandMark />
            <span className="font-semibold tracking-tight">Trainerbot</span>
          </NavLink>

          <nav aria-label="Principal" className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/ajustes"
              aria-label="Ajustes"
              className={({ isActive }) =>
                cn(
                  "ml-1 inline-flex size-10 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <SettingsIcon size={18} />
            </NavLink>
          </nav>
        </div>
      </header>

      <main
        id="contenido"
        className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 sm:px-6 md:pt-10 md:pb-12"
      >
        <Outlet />
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-full transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "",
                    )}
                  >
                    <Icon size={20} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
