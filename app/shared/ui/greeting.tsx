import { useEffect, useState } from "react";

import { common } from "~/content/common";
import { type GreetingPeriod, greetingPeriod } from "~/shared/lib/greeting";

const GREETINGS: Record<GreetingPeriod, string> = {
  morning: common.greetings.morning,
  afternoon: common.greetings.afternoon,
  evening: common.greetings.evening,
};

/**
 * Saludo calculado en el navegador. Arranca en «Hola» para que el HTML del
 * servidor y la primera renderización del cliente coincidan.
 */
export function Greeting() {
  const [greeting, setGreeting] = useState(common.greetings.hello);

  useEffect(() => {
    setGreeting(GREETINGS[greetingPeriod(new Date().getHours())]);
  }, []);

  return <>{greeting}</>;
}
