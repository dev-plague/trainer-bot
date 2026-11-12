import { z } from "zod";

import { onboardingText } from "~/content/onboarding";
import { ADDRESS_FORMS, DEFAULT_ADDRESS_FORM } from "./address-form";

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
