import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export class NormalizationError extends Error {}

export function normalizePhone(input: string, defaultCountry: CountryCode = "PL"): string {
  const trimmed = input.trim();
  if (!trimmed) throw new NormalizationError("empty");
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) throw new NormalizationError(`invalid: ${input}`);
  return parsed.number;
}
