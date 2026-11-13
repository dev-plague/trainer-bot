import { muscleLabel } from "~/content/exercises";
import { plansText } from "~/content/plans";
import type { MuscleGroup } from "~/features/exercises/domain/muscles";
import { cn } from "~/shared/lib/utils";
import { Badge } from "./badge";
import { type ExerciseKind, ExerciseTypeIcon, MuscleIcon } from "./icons";

export function ExerciseTypeBadge({ kind, className }: { kind: ExerciseKind; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-normal", className)}>
      <ExerciseTypeIcon kind={kind} size={14} />
      {plansText.types[kind]}
    </Badge>
  );
}

export function MuscleBadges({
  muscles,
  max = 3,
  className,
}: {
  muscles: readonly MuscleGroup[];
  max?: number;
  className?: string;
}) {
  const shown = muscles.slice(0, max);
  const rest = muscles.length - shown.length;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((muscle) => (
        <Badge key={muscle} variant="outline" className="gap-1 font-normal">
          <MuscleIcon group={muscle} size={12} />
          {muscleLabel(muscle)}
        </Badge>
      ))}
      {rest > 0 ? (
        <Badge variant="outline" className="font-normal">
          +{rest}
        </Badge>
      ) : null}
    </div>
  );
}
