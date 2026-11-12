import { z } from "zod";

/** Subir esta versión obliga a responder de nuevo el cuestionario. */
export const PARQ_VERSION = "parq-v1";

export const PARQ_QUESTION_IDS = [
  "heart_condition",
  "chest_pain",
  "dizziness",
  "bone_joint",
  "blood_pressure_meds",
  "pregnancy",
  "other_reason",
] as const;

export type ParqQuestionId = (typeof PARQ_QUESTION_IDS)[number];

export type ParqAnswers = Record<ParqQuestionId, boolean>;

const yesNo = z.enum(["yes", "no"]);

export const parqFormSchema = z.object({
  heart_condition: yesNo,
  chest_pain: yesNo,
  dizziness: yesNo,
  bone_joint: yesNo,
  blood_pressure_meds: yesNo,
  pregnancy: yesNo,
  other_reason: yesNo,
});

export type ParqFormInput = z.infer<typeof parqFormSchema>;

export function toAnswers(input: ParqFormInput): ParqAnswers {
  return {
    heart_condition: input.heart_condition === "yes",
    chest_pain: input.chest_pain === "yes",
    dizziness: input.dizziness === "yes",
    bone_joint: input.bone_joint === "yes",
    blood_pressure_meds: input.blood_pressure_meds === "yes",
    pregnancy: input.pregnancy === "yes",
    other_reason: input.other_reason === "yes",
  };
}

export function needsMedicalClearance(answers: ParqAnswers): boolean {
  return PARQ_QUESTION_IDS.some((id) => answers[id]);
}
