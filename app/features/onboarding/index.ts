export { getAcceptedConsents, recordConsents } from "./data/consents";
export { getProfile, saveProfile, saveProfileDetails } from "./data/profile";
export type { AddressForm } from "./domain/address-form";
export { ADDRESS_FORMS, DEFAULT_ADDRESS_FORM } from "./domain/address-form";
export { ADULT_AGE, calculateAge, isAdult } from "./domain/age";
export type { ConsentKind } from "./domain/consents";
export { CONSENT_KINDS, CONSENT_VERSION, missingConsents } from "./domain/consents";
export type { ProfileDetailsInput, ProfileSetupInput } from "./domain/profile";
export { profileDetailsSchema, profileSetupSchema } from "./domain/profile";
