export const CONSENT_KINDS = ["safety_notice", "health_data"] as const;

export type ConsentKind = (typeof CONSENT_KINDS)[number];

/** Subir esta versión obliga a volver a aceptar los textos. */
export const CONSENT_VERSION = "v1";

export type AcceptedConsent = {
  kind: string;
  version: string;
};

/**
 * Consentimientos que faltan para la versión vigente. Una aceptación de una
 * versión anterior no cuenta.
 */
export function missingConsents(
  accepted: readonly AcceptedConsent[],
  version: string = CONSENT_VERSION,
): ConsentKind[] {
  return CONSENT_KINDS.filter(
    (kind) => !accepted.some((consent) => consent.kind === kind && consent.version === version),
  );
}
