"use client";

import { useEffect, useRef, useState } from "react";
import { addressConfig } from "@/config/estimator.config";
import { publicEnv } from "@/lib/env";
import { loadGoogleMapsScript, parseGooglePlace, type ParsedGooglePlace } from "@/lib/address/google-places";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLElement | null>(null);

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
        const { PlaceAutocompleteElement } = (await window.google.maps.importLibrary(
          "places",
        )) as { PlaceAutocompleteElement: new (opts?: Record<string, unknown>) => HTMLElement };

        if (cancelled || !containerRef.current) return;

        const el = new PlaceAutocompleteElement({
          includedRegionCodes: [...addressConfig.countryRestrictions],
          locationBias: {
            radius: addressConfig.bias.radiusMeters,
            center: { lat: addressConfig.bias.lat, lng: addressConfig.bias.lng },
          },
        }) as HTMLElement & Record<string, unknown>;
        el.setAttribute("placeholder", "Start typing your address…");
        el.className = "ge-places-autocomplete";

        el.addEventListener("gmp-select", async (event: Event) => {
          try {
            const { placePrediction } = event as unknown as {
              placePrediction: { toPlace: () => Record<string, unknown> };
            };
            const place = placePrediction.toPlace() as {
              fetchFields: (opts: { fields: string[] }) => Promise<void>;
            } & Record<string, unknown>;
            await place.fetchFields({
              fields: ["addressComponents", "formattedAddress", "location", "id"],
            });
            const parsed = parseGooglePlace(
              place as unknown as Parameters<typeof parseGooglePlace>[0],
            );
            if (!parsed.formattedAddress) return;
            setPlacesSelection(toAddressInput(parsed));
            setError(null);
          } catch {
            setError("We couldn't read that address. Please try again or enter it manually.");
          }
        });

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(el);
        elementRef.current = el;
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
          <label htmlFor="ge-places-container" className="sr-only">
            Project address
          </label>
          <div
            id="ge-places-container"
            ref={containerRef}
            className="ge-places-container min-h-[52px] rounded-xl border-2 border-[var(--ge-light-gray)] focus-within:border-[var(--ge-green)]"
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
