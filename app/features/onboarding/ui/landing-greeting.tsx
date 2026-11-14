import { useEffect, useState } from "react";

import { landing } from "~/content/landing";
import { type GreetingPeriod, greetingPeriod } from "~/shared/lib/greeting";

const GREETINGS: Record<GreetingPeriod, string> = {
  morning: landing.greeting.morning,
  afternoon: landing.greeting.afternoon,
  evening: landing.greeting.evening,
};

/**
 * Saludo según la hora local del navegador. El primer render usa «Hola.» para
 * que el HTML del servidor y la hidratación coincidan; el alto de la línea está
 * reservado para que el cambio no mueva la maquetación.
 */
export function LandingGreeting() {
  const [greeting, setGreeting] = useState(landing.greeting.fallback);

  useEffect(() => {
    setGreeting(GREETINGS[greetingPeriod(new Date().getHours())]);
  }, []);

  return <p className="min-h-5 text-sm text-muted-foreground">{greeting}</p>;
}
