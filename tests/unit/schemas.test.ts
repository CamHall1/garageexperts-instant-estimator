import { describe, expect, it } from "vitest";
import { contactSchema, selectedPlanSchema, squareFootageInputSchema } from "@/lib/validation/schemas";

describe("squareFootageInputSchema", () => {
  it("accepts plain numbers and strings", () => {
    expect(squareFootageInputSchema.parse(500)).toBe(500);
    expect(squareFootageInputSchema.parse("500")).toBe(500);
  });

  it("normalizes commas and whitespace", () => {
    expect(squareFootageInputSchema.parse(" 1,234 ")).toBe(1234);
  });

  it("rounds fractional input to a whole number", () => {
    expect(squareFootageInputSchema.parse("500.6")).toBe(501);
  });

  it("rejects below the minimum and above the maximum", () => {
    expect(squareFootageInputSchema.safeParse("49").success).toBe(false);
    expect(squareFootageInputSchema.safeParse("10001").success).toBe(false);
  });

  it("accepts the exact boundaries", () => {
    expect(squareFootageInputSchema.parse("50")).toBe(50);
    expect(squareFootageInputSchema.parse("10000")).toBe(10000);
  });

  it("rejects non-numeric input", () => {
    expect(squareFootageInputSchema.safeParse("not a number").success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("accepts a valid contact", () => {
    const result = contactSchema.safeParse({
      fullName: "Jordan Taylor",
      email: "jordan@example.com",
      phone: "503-555-1212",
      smsConsent: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts multi-part names with hyphens and apostrophes", () => {
    const result = contactSchema.safeParse({
      fullName: "Mary Ann O'Neil-Smith",
      email: "mary@example.com",
      phone: "503-555-1212",
      smsConsent: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = contactSchema.safeParse({
      fullName: "Jordan Taylor",
      email: "not-an-email",
      phone: "503-555-1212",
      smsConsent: false,
    });
    expect(result.success).toBe(false);
  });

  it("requires smsConsent to be an explicit boolean, defaulting to unchecked in the UI, not the schema", () => {
    const result = contactSchema.safeParse({
      fullName: "Jordan Taylor",
      email: "jordan@example.com",
      phone: "503-555-1212",
      smsConsent: false,
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.smsConsent).toBe(false);
  });
});

describe("selectedPlanSchema", () => {
  it("accepts the four allowed values", () => {
    for (const value of ["silver", "gold", "platinum", "all_options"]) {
      expect(selectedPlanSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(selectedPlanSchema.safeParse("bronze").success).toBe(false);
  });
});
