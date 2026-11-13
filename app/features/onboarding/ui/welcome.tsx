import { Link } from "react-router";

import { common } from "~/content/common";
import { requireGuest } from "~/features/auth";
import { Button } from "~/shared/ui/button";
import { Card, CardContent } from "~/shared/ui/card";
import { ArrowRightIcon, PlanIcon } from "~/shared/ui/icons";
import { BrandMark } from "~/shared/ui/page-header";
import type { Route } from "./+types/welcome";

export function meta() {
  return [{ title: common.appName }, { name: "description", content: common.tagline }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return requireGuest(request);
}

export default function Welcome() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(70%_60%_at_50%_0%,var(--accent),transparent)]"
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="font-semibold tracking-tight">{common.appName}</span>
        </div>
        <Link
          to="/entrar"
          className="rounded-lg px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {common.login}
        </Link>
      </div>

      <header className="relative space-y-4">
        <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance">
          {common.tagline}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{common.notAi}</p>
      </header>

      <Card className="relative border-primary/20 bg-card/80 shadow-sm backdrop-blur">
        <CardContent className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <PlanIcon size={20} />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">{common.welcomeCard}</p>
        </CardContent>
      </Card>

      <Button asChild size="lg" className="relative w-full gap-2">
        <Link to="/registro">
          {common.createAccount}
          <ArrowRightIcon size={18} />
        </Link>
      </Button>
    </main>
  );
}
