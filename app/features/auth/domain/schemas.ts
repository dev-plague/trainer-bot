import { z } from "zod";

import { authText } from "~/content/auth";

const email = z.string().trim().toLowerCase().pipe(z.email(authText.errors.invalidEmail));

const password = z
  .string()
  .min(8, authText.errors.shortPassword)
  .max(128, authText.errors.longPassword);

export const signUpSchema = z.object({
  name: z.string().trim().min(1, authText.errors.missingName).max(80),
  email,
  password,
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, authText.errors.missingPassword),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
