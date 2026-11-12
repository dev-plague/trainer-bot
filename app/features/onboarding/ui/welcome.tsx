import { common } from "~/content/common";
import { Button } from "~/shared/ui/button";

export function meta() {
  return [{ title: common.appName }, { name: "description", content: common.tagline }];
}

export default function Welcome() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-10 px-6 py-12">
      <header className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {common.appName}
        </p>
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {common.tagline}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{common.notAi}</p>
      </header>
      <div className="space-y-3">
        <Button className="w-full" size="lg" disabled>
          {common.start}
        </Button>
        <p className="text-center text-sm text-muted-foreground">{common.comingSoon}</p>
      </div>
    </main>
  );
}
