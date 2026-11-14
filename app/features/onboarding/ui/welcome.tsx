import { Link } from "react-router";

import { landing } from "~/content/landing";
import { requireGuest } from "~/features/auth";
import { Button } from "~/shared/ui/button";
import type { Route } from "./+types/welcome";
import { LandingGreeting } from "./landing-greeting";

export function meta() {
  return [{ title: landing.wordmark }, { name: "description", content: landing.pitch }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return requireGuest(request);
}

export default function Welcome() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:justify-center sm:px-8 sm:py-16">
        <header className="flex min-h-16 items-center justify-between">
          <p className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-accent" />
            {landing.wordmark}
          </p>
          <Link
            to="/entrar"
            className="-mr-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {landing.login}
          </Link>
        </header>

        <div className="landing-rise flex flex-1 flex-col justify-center gap-3 pt-10 pb-16 sm:flex-none sm:gap-4 sm:pt-16 sm:pb-0">
          <LandingGreeting />
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
            {landing.headline}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">{landing.pitch}</p>
        </div>

        <div className="flex flex-col gap-3 sm:mt-12">
          <Button asChild size="lg" className="h-12 w-full text-base">
            <Link to="/registro">{landing.cta}</Link>
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {landing.disclaimer}
          </p>
        </div>
      </div>
    </main>
  );
}
