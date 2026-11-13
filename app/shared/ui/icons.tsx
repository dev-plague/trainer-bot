import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BackMuscleBodyIcon,
  BicepsFlexedIcon,
  BodyPartLegIcon,
  BodyPartMuscleIcon,
  BodyPartSixPackIcon,
  BodyWeightIcon,
  CalendarCheckIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Dumbbell01Icon,
  Logout01Icon,
  Settings01Icon,
  ShoulderIcon,
  Tick02Icon,
  Timer01Icon,
  UserIcon,
  WalkingIcon,
  Yoga01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";

import type { MuscleGroup } from "~/features/exercises/domain/muscles";

type IconProps = Omit<HugeiconsIconProps, "icon">;

export function CheckIcon(props: IconProps) {
  return <HugeiconsIcon icon={Tick02Icon} {...props} />;
}

export function ChevronDownIcon(props: IconProps) {
  return <HugeiconsIcon icon={ArrowDown01Icon} {...props} />;
}

export function ChevronUpIcon(props: IconProps) {
  return <HugeiconsIcon icon={ArrowUp01Icon} {...props} />;
}

export function ChevronLeftIcon(props: IconProps) {
  return <HugeiconsIcon icon={ArrowLeft01Icon} {...props} />;
}

export function ChevronRightIcon(props: IconProps) {
  return <HugeiconsIcon icon={ArrowRight01Icon} {...props} />;
}

export function XIcon(props: IconProps) {
  return <HugeiconsIcon icon={Cancel01Icon} {...props} />;
}

export function ArrowRightIcon(props: IconProps) {
  return <HugeiconsIcon icon={ArrowRight01Icon} {...props} />;
}

export function PlanIcon(props: IconProps) {
  return <HugeiconsIcon icon={CalendarCheckIcon} {...props} />;
}

export function BmiIcon(props: IconProps) {
  return <HugeiconsIcon icon={BodyWeightIcon} {...props} />;
}

export function AccountIcon(props: IconProps) {
  return <HugeiconsIcon icon={UserIcon} {...props} />;
}

export function SettingsIcon(props: IconProps) {
  return <HugeiconsIcon icon={Settings01Icon} {...props} />;
}

export function LogoutIcon(props: IconProps) {
  return <HugeiconsIcon icon={Logout01Icon} {...props} />;
}

export function AlertIcon(props: IconProps) {
  return <HugeiconsIcon icon={Alert02Icon} {...props} />;
}

export function SuccessIcon(props: IconProps) {
  return <HugeiconsIcon icon={CheckmarkCircle02Icon} {...props} />;
}

export type ExerciseKind = "strength" | "isometric" | "cardio" | "mobility";

const TYPE_ICONS: Record<ExerciseKind, IconSvgElement> = {
  strength: Dumbbell01Icon,
  isometric: Timer01Icon,
  cardio: WalkingIcon,
  mobility: Yoga01Icon,
};

export function ExerciseTypeIcon({ kind, ...props }: IconProps & { kind: ExerciseKind }) {
  return <HugeiconsIcon icon={TYPE_ICONS[kind]} {...props} />;
}

const MUSCLE_ICONS: Record<MuscleGroup, IconSvgElement> = {
  chest: BodyPartMuscleIcon,
  back: BackMuscleBodyIcon,
  shoulders: ShoulderIcon,
  biceps: BicepsFlexedIcon,
  triceps: BodyPartMuscleIcon,
  quads: BodyPartLegIcon,
  hamstrings: BodyPartLegIcon,
  glutes: BodyPartLegIcon,
  calves: BodyPartLegIcon,
  core: BodyPartSixPackIcon,
};

export function MuscleIcon({ group, ...props }: IconProps & { group: MuscleGroup }) {
  return <HugeiconsIcon icon={MUSCLE_ICONS[group]} {...props} />;
}
