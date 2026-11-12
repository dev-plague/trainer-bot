import { Link } from "react-router";

import { common } from "~/content/common";
import { Button } from "~/shared/ui/button";

export function meta() {
  return [{ title: common.appName }, { name: "description", content: common.tagline }];
}

export default function Welcome() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-10 px-6 py-12">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <Link
          to="/entrar"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {common.login}
        </Link>
      </div>

      <header className="space-y-4">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {common.tagline}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{common.notAi}</p>
      </header>

      <Button asChild size="lg" className="w-full">
        <Link to="/registro">{common.createAccount}</Link>
      </Button>
    </main>
  );
}
