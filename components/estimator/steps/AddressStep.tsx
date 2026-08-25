"use client";

import { useEffect, useRef, useState } from "react";
import { addressConfig } from "@/config/estimator.config";
import { publicEnv } from "@/lib/env";
import {
  loadGoogleMapsScript,
  parseLegacyGooglePlace,
  type ParsedGooglePlace,
} from "@/lib/address/google-places";
import { StepHeading } from "@/components/estimator/StepHeading";
import type { AddressInput } from "@/lib/validation/schemas";

export interface AddressStepProps {
  initialValue: AddressInput | null;
  onNext: (address: AddressInput) => void;
  onBack: () => void;
}

type PlacesStatus = "idle" | "loading" | "ready" | "unavailable";

function toAddressInput(parsed: ParsedGooglePlace): AddressInput {
  return {
    formattedAddress: parsed.formattedAddress,
    addressLine1: parsed.addressLine1,
    addressLine2: parsed.addressLine2,
    city: parsed.city,
    region: parsed.region,
    postalCode: parsed.postalCode,
    country: parsed.country || "US",
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    placeId: parsed.placeId,
    addressSource: "google_places",
  };
}

export function AddressStep({ initialValue, onNext, onBack }: AddressStepProps) {
  const apiKey = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [manualMode, setManualMode] = useState(!apiKey || initialValue?.addressSource === "manual");
  const [placesStatus, setPlacesStatus] = useState<PlacesStatus>(apiKey ? "loading" : "unavailable");
  const [placesSelection, setPlacesSelection] = useState<AddressInput | null>(
    initialValue?.addressSource === "google_places" ? initialValue : null,
  );
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<{ addListener: (event: string, cb: () => void) => void } | null>(
    null,
  );

  const [manual, setManual] = useState({
    addressLine1: initialValue?.addressSource === "manual" ? initialValue.addressLine1 : "",
    city: initialValue?.addressSource === "manual" ? initialValue.city ?? "" : "",
    region: initialValue?.addressSource === "manual" ? initialValue.region ?? "" : "",
    postalCode: initialValue?.addressSource === "manual" ? initialValue.postalCode ?? "" : "",
  });

  useEffect(() => {
    if (manualMode || !apiKey || placesStatus !== "loading") return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(async () => {
        if (cancelled || !window.google?.maps?.importLibrary) throw new Error("unavailable");
        const { Autocomplete } = (await window.google.maps.importLibrary("places")) as {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: Record<string, unknown>,
          ) => {
            addListener: (event: string, cb: () => void) => void;
            getPlace: () => Record<string, unknown>;
          };
        };

        if (cancelled || !inputRef.current) return;

        const autocomplete = new Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address", "geometry", "place_id"],
          types: ["address"],
          componentRestrictions: { country: [...addressConfig.countryRestrictions] },
        });

        autocomplete.addListener("place_changed", () => {
          try {
            const place = autocomplete.getPlace();
            const parsed = parseLegacyGooglePlace(
              place as unknown as Parameters<typeof parseLegacyGooglePlace>[0],
            );
            if (!parsed.formattedAddress) {
              setError("We couldn't read that address. Please try again or enter it manually.");
              return;
            }
            setPlacesSelection(toAddressInput(parsed));
            setError(null);
          } catch {
            setError("We couldn't read that address. Please try again or enter it manually.");
          }
        });

        autocompleteRef.current = autocomplete;
        setPlacesStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setPlacesStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, manualMode, placesStatus]);

  function handleNext() {
    if (!manualMode) {
      if (!placesSelection) {
        setError("Select an address from the suggestions, or enter it manually.");
        return;
      }
      onNext(placesSelection);
      return;
    }

    if (!manual.addressLine1.trim()) {
      setError("Enter the street address.");
      return;
    }
    const formattedAddress = [
      manual.addressLine1,
      [manual.city, manual.region].filter(Boolean).join(", "),
      manual.postalCode,
    ]
      .filter(Boolean)
      .join(", ");

    onNext({
      formattedAddress,
      addressLine1: manual.addressLine1.trim(),
      addressLine2: "",
      city: manual.city.trim(),
      region: manual.region.trim(),
      postalCode: manual.postalCode.trim(),
      country: "US",
      latitude: null,
      longitude: null,
      placeId: "",
      addressSource: "manual",
    });
  }

  return (
    <div>
      <StepHeading subtext="Enter the full address of the garage you would like coated.">
        Where is the project located?
      </StepHeading>

      {!manualMode ? (
        <div>
          <label htmlFor="ge-places-input" className="sr-only">
            Project address
          </label>
          <input
            id="ge-places-input"
            ref={inputRef}
            type="text"
            placeholder="Start typing your address…"
            autoComplete="off"
            onChange={() => {
              if (placesSelection) setPlacesSelection(null);
            }}
            className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base text-[var(--ge-dark-gray)] outline-none focus-visible:border-[var(--ge-green)]"
          />
          {placesStatus === "loading" ? (
            <p className="mt-2 text-sm text-[var(--ge-supporting-gray)]">Loading address search…</p>
          ) : null}
          {placesSelection ? (
            <p className="mt-2 text-sm font-medium text-[var(--ge-dark-gray)]">
              Selected: {placesSelection.formattedAddress}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className="mt-3 text-sm font-semibold text-[var(--ge-green-dark)] underline underline-offset-2"
          >
            Enter address manually
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="addr-line1" className="mb-1 block text-sm font-medium text-[var(--ge-dark-gray)]">
              Address Line 1
            </label>
            <input
              id="addr-line1"
              autoComplete="address-line1"
              value={manual.addressLine1}
              onChange={(e) => setManual((m) => ({ ...m, addressLine1: e.target.value }))}
              className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base outline-none focus-visible:border-[var(--ge-green)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="addr-city" className="mb-1 block text-sm font-medium text-[var(--ge-dark-gray)]">
                City
              </label>
              <input
                id="addr-city"
                autoComplete="address-level2"
                value={manual.city}
                onChange={(e) => setManual((m) => ({ ...m, city: e.target.value }))}
                className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base outline-none focus-visible:border-[var(--ge-green)]"
              />
            </div>
            <div>
              <label htmlFor="addr-region" className="mb-1 block text-sm font-medium text-[var(--ge-dark-gray)]">
                State/Region
              </label>
              <input
                id="addr-region"
                autoComplete="address-level1"
                value={manual.region}
                onChange={(e) => setManual((m) => ({ ...m, region: e.target.value }))}
                className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base outline-none focus-visible:border-[var(--ge-green)]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="addr-postal" className="mb-1 block text-sm font-medium text-[var(--ge-dark-gray)]">
              Postal Code
            </label>
            <input
              id="addr-postal"
              autoComplete="postal-code"
              value={manual.postalCode}
              onChange={(e) => setManual((m) => ({ ...m, postalCode: e.target.value }))}
              className="w-full rounded-xl border-2 border-[var(--ge-light-gray)] px-4 py-3 text-base outline-none focus-visible:border-[var(--ge-green)]"
            />
          </div>
          {apiKey ? (
            <button
              type="button"
              onClick={() => {
                setManualMode(false);
                setPlacesStatus((current) => (current === "idle" ? current : "loading"));
              }}
              className="text-sm font-semibold text-[var(--ge-green-dark)] underline underline-offset-2"
            >
              Search for my address instead
            </button>
          ) : null}
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] rounded-full px-5 py-3 text-sm font-semibold text-[var(--ge-dark-gray)] transition-colors hover:bg-[var(--ge-light-gray)] motion-reduce:transition-none"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="min-h-[44px] flex-1 rounded-full bg-[var(--ge-green)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--ge-green-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ge-green)] motion-reduce:transition-none sm:flex-none"
        >
          Next
        </button>
      </div>
    </div>
  );
}
