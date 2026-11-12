import { z } from "zod";

import { onboardingText } from "~/content/onboarding";
import { ADDRESS_FORMS, DEFAULT_ADDRESS_FORM } from "./address-form";
import { parseBirthDate } from "./age";

export const preferredNameSchema = z
  .string()
  .trim()
  .min(1, onboardingText.errors.missingName)
  .max(40, onboardingText.errors.longName);

export const addressFormSchema = z.enum(ADDRESS_FORMS);

export const profileSetupSchema = z.object({
  preferredName: preferredNameSchema,
  addressForm: addressFormSchema.default(DEFAULT_ADDRESS_FORM),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, onboardingText.errors.birthDateInvalid)
  .refine((value) => parseBirthDate(value) !== null, onboardingText.errors.birthDateInvalid);

const heightSchema = z.coerce
  .number({ error: onboardingText.errors.heightInvalid })
  .int(onboardingText.errors.heightInvalid)
  .min(120, onboardingText.errors.heightInvalid)
  .max(250, onboardingText.errors.heightInvalid);

const weightSchema = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce
    .number({ error: onboardingText.errors.weightInvalid })
    .min(30, onboardingText.errors.weightInvalid)
    .max(300, onboardingText.errors.weightInvalid)
    .optional(),
);

export const profileDetailsSchema = z.object({
  birthDate: birthDateSchema,
  heightCm: heightSchema,
  weightKg: weightSchema,
});

export type ProfileDetailsInput = z.infer<typeof profileDetailsSchema>;
