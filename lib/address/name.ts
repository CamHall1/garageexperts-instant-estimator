export interface SplitName {
  firstName: string;
  lastName: string;
}

/**
 * Derives first/last name from a full-name string without damaging
 * multi-part names (e.g. "Mary Ann O'Neil-Smith" -> first "Mary Ann",
 * last "O'Neil-Smith"). The full name remains the canonical value; this
 * split exists only for systems (like GHL) that expect separate fields.
 */
export function splitFullName(fullName: string): SplitName {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const parts = trimmed.split(" ");
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
}
