import { type GeneratedPlan, type PlanRequest, planRequestSchema } from "../domain/contract";
import { generatePlan } from "../domain/generate";
import { loadCandidateExercises } from "./catalog";
import { saveGeneratedPlan } from "./plan-repository";

export type GenerateAndSaveResult = {
  planId: string;
  plan: GeneratedPlan;
};

/** Valida, genera con el catálogo real y persiste el plan. */
export async function generatePlanForUser(
  userId: string,
  input: unknown,
): Promise<GenerateAndSaveResult> {
  const request: PlanRequest = planRequestSchema.parse(input);
  const candidates = await loadCandidateExercises();
  const plan = generatePlan(request, candidates);
  const planId = await saveGeneratedPlan(userId, request, plan);

  return { planId, plan };
}
