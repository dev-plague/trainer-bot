export { getAcceptedConsents, recordConsents } from "./data/consents";
export { getProfile, saveProfile } from "./data/profile";
export type { AddressForm } from "./domain/address-form";
export { ADDRESS_FORMS, DEFAULT_ADDRESS_FORM } from "./domain/address-form";
export type { ConsentKind } from "./domain/consents";
export { CONSENT_KINDS, CONSENT_VERSION, missingConsents } from "./domain/consents";
export type { ProfileSetupInput } from "./domain/profile";
export { profileSetupSchema } from "./domain/profile";
