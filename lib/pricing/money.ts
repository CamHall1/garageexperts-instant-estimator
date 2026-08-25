/**
 * Decimal-safe money helpers. All internal math happens in integer cents so
 * we never accumulate binary floating-point error across the pricing engine.
 */

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Round to the nearest $50 increment using ordinary half-up rounding. */
export function roundToIncrementCents(cents: number, incrementCents: number): number {
  return Math.round(cents / incrementCents) * incrementCents;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Formats whole-dollar cents (must already be a multiple of 100) as "$3,600". */
export function formatWholeDollarsFromCents(cents: number): string {
  return USD_FORMATTER.format(Math.round(cents / 100));
}

export function formatRange(lowCents: number, highCents: number): string {
  return `${formatWholeDollarsFromCents(lowCents)}–${formatWholeDollarsFromCents(highCents)}`;
}
