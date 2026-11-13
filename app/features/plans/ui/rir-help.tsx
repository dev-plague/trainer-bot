import { plansText } from "~/content/plans";
import { Button } from "~/shared/ui/button";
import { HelpIcon } from "~/shared/ui/icons";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/shared/ui/popover";

/** Explica el RIR una sola vez por pantalla, sin repetirlo en cada tarjeta. */
export function RirHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-full text-muted-foreground"
          aria-label={plansText.rir.trigger}
        >
          <HelpIcon size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] space-y-2">
        <PopoverHeader>
          <PopoverTitle>{plansText.rir.title}</PopoverTitle>
        </PopoverHeader>
        <PopoverDescription className="text-sm leading-relaxed">
          {plansText.rir.body}
        </PopoverDescription>
        <p className="text-sm leading-relaxed">{plansText.rir.example}</p>
      </PopoverContent>
    </Popover>
  );
}
