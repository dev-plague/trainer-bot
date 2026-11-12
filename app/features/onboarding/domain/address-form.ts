export const ADDRESS_FORMS = ["neutral", "feminine", "masculine"] as const;

export type AddressForm = (typeof ADDRESS_FORMS)[number];

export const DEFAULT_ADDRESS_FORM: AddressForm = "neutral";
