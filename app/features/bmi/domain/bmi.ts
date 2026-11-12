/**
 * IMC con cortes de la OMS. Solo para adultos: la pantalla debe comprobar la
 * edad antes de mostrar cualquier cifra (brief §3.5).
 */

export const BMI_CATEGORIES = ["underweight", "normal", "overweight", "obesity"] as const;

export type BmiCategory = (typeof BMI_CATEGORIES)[number];

const MIN_HEIGHT_CM = 120;
const MAX_HEIGHT_CM = 250;
const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 300;

const NORMAL_MIN_BMI = 18.5;
const NORMAL_MAX_BMI = 24.9;

function assertAdultMeasurements(weightKg: number, heightCm: number) {
  if (!Number.isFinite(weightKg) || weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
    throw new RangeError(`Peso fuera de rango: ${weightKg}`);
  }

  if (!Number.isFinite(heightCm) || heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM) {
    throw new RangeError(`Estatura fuera de rango: ${heightCm}`);
  }
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  assertAdultMeasurements(weightKg, heightCm);

  const heightM = heightCm / 100;

  return weightKg / (heightM * heightM);
}

export function classifyBmi(bmi: number): BmiCategory {
  if (bmi < NORMAL_MIN_BMI) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";

  return "obesity";
}

export type HealthyWeightRange = {
  minKg: number;
  maxKg: number;
};

/** Rango de peso para IMC 18.5–24.9 a una estatura dada. */
export function healthyWeightRange(heightCm: number): HealthyWeightRange {
  assertAdultMeasurements(MIN_WEIGHT_KG, heightCm);

  const heightM = heightCm / 100;
  const square = heightM * heightM;

  return {
    minKg: roundToOneDecimal(NORMAL_MIN_BMI * square),
    maxKg: roundToOneDecimal(NORMAL_MAX_BMI * square),
  };
}

export type WeightGoal = {
  targetKg: number;
  direction: "lose" | "gain";
};

/**
 * Primer paso realista, no una cifra ideal:
 * - En rango normal: `null` (no se sugiere bajar).
 * - Por encima: 5 % del peso actual, sin bajar del límite superior saludable.
 * - Por debajo: alcanzar el límite inferior saludable.
 */
export function intermediateGoal(weightKg: number, heightCm: number): WeightGoal | null {
  const category = classifyBmi(calculateBmi(weightKg, heightCm));
  const range = healthyWeightRange(heightCm);

  if (category === "normal") return null;

  if (weightKg > range.maxKg) {
    const fivePercentStep = weightKg * 0.95;

    return {
      targetKg: roundToOneDecimal(Math.max(fivePercentStep, range.maxKg)),
      direction: "lose",
    };
  }

  return { targetKg: range.minKg, direction: "gain" };
}
