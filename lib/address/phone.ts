import { parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js";

export interface NormalizedPhone {
  e164: string;
  display: string;
}

/** Normalizes to E.164 for delivery while preserving a friendly display form. */
export function normalizePhone(raw: string, defaultCountry: CountryCode = "US"): NormalizedPhone | null {
  try {
    const parsed = parsePhoneNumberWithError(raw, defaultCountry);
    if (!parsed || !parsed.isValid()) return null;
    return {
      e164: parsed.number,
      display: parsed.formatNational(),
    };
  } catch {
    return null;
  }
}
