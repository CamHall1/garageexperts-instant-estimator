"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { business, consent } from "@/config/estimator.config";
import { contactSchema, type ContactInput } from "@/lib/validation/schemas";
import { normalizePhone } from "@/lib/address/phone";
import { StepHeading } from "@/components/estimator/StepHeading";

export interface ContactStepProps {
  initialValue: ContactInput | null;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (contact: ContactInput, honeypot: string) => void;
  onBack: () => void;
}

export function ContactStep({ initialValue, submitting, submitError, onSubmit, onBack }: ContactStepProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialValue ?? { fullName: "", email: "", phone: "", smsConsent: false },
  });

  function onValid(data: ContactInput) {
    const normalizedPhone = normalizePhone(data.phone);
    if (!normalizedPhone) {
      setError("phone", { message: "Enter a valid phone number." });
      return;
    }
    const honeypotValue = (document.getElementById("ge-hp-9x2") as HTMLInputElement | null)?.value ?? "";
    onSubmit(data, honeypotValue);
  }

  return (
    <div>
      <StepHeading subtext="Where should we send your personalized garage-floor options?">
        Your estimate is ready
      </StepHeading>

      <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
        {/*
          Honeypot: hidden from sighted users and keyboard tab order; real
          bots fill it, so a non-empty value on submit means "reject."
          Deliberately avoid any name/id/label resembling a real profile
          field (e.g. "website", "company", "url") -- browser and password-
          manager autofill match on exactly that vocabulary, and would
          otherwise silently fill this field for real users and get them
          incorrectly flagged as bots.
        */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
          <label htmlFor="ge-hp-9x2">Leave this field blank</label>
          <input
            id="ge-hp-9x2"
            name="ge_confirm_9x2"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-[var(--ge-dark-gray)]">
            Full Name
          </label>
          <input
            id="contact-name"
            autoComplete="name"
            aria-invalid={errors.fullName ? "true" : undefined}
            aria-describedby={errors.fullName ? "contact-name-error" : undefined}
            className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base outline-none focus-visible:border-[var(--ge-green)]"
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p id="contact-name-error" role="alert" className="mt-1 text-sm font-medium text-red-700">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="contact-phone" className="mb-1 block text-sm font-medium text-[var(--ge-dark-gray)]">
            Phone
          </label>
          <input
            id="contact-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
            className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base outline-none focus-visible:border-[var(--ge-green)]"
            {...register("phone")}
          />
          {errors.phone ? (
            <p id="contact-phone-error" role="alert" className="mt-1 text-sm font-medium text-red-700">
              {errors.phone.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-[var(--ge-dark-gray)]">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base outline-none focus-visible:border-[var(--ge-green)]"
            {...register("email")}
          />
          {errors.email ? (
            <p id="contact-email-error" role="alert" className="mt-1 text-sm font-medium text-red-700">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-[var(--ge-light-gray)] p-4">
          <input
            id="sms-consent"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-[var(--ge-supporting-gray)] text-[var(--ge-green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ge-green)]"
            {...register("smsConsent")}
          />
          <label htmlFor="sms-consent" className="text-sm text-[var(--ge-dark-gray)]">
            {consent.smsDisclosureText}
          </label>
        </div>

        <p className="text-xs text-[var(--ge-supporting-gray)]">
          {consent.privacyNotice}{" "}
          <a href={business.privacyUrl} target="_blank" rel="noreferrer" className="underline">
            Privacy Policy
          </a>{" "}
          &middot;{" "}
          <a href={business.termsUrl} target="_blank" rel="noreferrer" className="underline">
            Terms
          </a>
        </p>

        {submitError ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {submitError}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="min-h-[44px] rounded-full px-5 py-3 text-sm font-semibold text-[var(--ge-dark-gray)] transition-colors hover:bg-[var(--ge-light-gray)] motion-reduce:transition-none"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] flex-1 rounded-full bg-[var(--ge-green)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--ge-green-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ge-green)] disabled:opacity-60 motion-reduce:transition-none sm:flex-none"
          >
            {submitting ? "Calculating your options…" : "View My Estimate"}
          </button>
        </div>
      </form>
    </div>
  );
}
