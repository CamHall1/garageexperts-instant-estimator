import { createHash } from "node:crypto";

/** One-way, non-reversible identifier hash. Never used for authentication alone. */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function hashContact(email: string, phoneE164: string): string {
  return hashIdentifier(`${email}|${phoneE164}`);
}

export function hashAddress(formattedAddress: string): string {
  return hashIdentifier(formattedAddress);
}
