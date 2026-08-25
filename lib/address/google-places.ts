"use client";

/**
 * Thin wrapper around the Google Maps JavaScript "Places (New)" library —
 * specifically the PlaceAutocompleteElement web component. Typed loosely
 * (the global `google` namespace) rather than pulling in @types/google.maps,
 * since this preview-era API surface still moves between releases; every
 * call is defensively guarded so a shape change degrades to manual entry
 * instead of crashing the estimator.
 *
 * Reference: https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
 */

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (name: string) => Promise<Record<string, unknown>>;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no_window"));
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = `__geGoogleMapsInit_${Date.now()}`;
    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      resolve();
      delete (window as unknown as Record<string, unknown>)[callbackName];
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&v=weekly&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("google_maps_load_failed"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface ParsedGooglePlace {
  formattedAddress: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string;
}

type AddressComponent = { longText?: string; shortText?: string; types?: string[] };

function componentText(
  components: AddressComponent[] | undefined,
  type: string,
  short = false,
): string {
  const match = components?.find((c) => c.types?.includes(type));
  return (short ? match?.shortText : match?.longText) ?? "";
}

function resolveLatLng(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof (value as { lat?: unknown }).lat === "function") {
    return ((value as { lat: () => number }).lat)();
  }
  if (typeof (value as { lat?: unknown }).lat === "number") {
    return (value as { lat: number }).lat;
  }
  return null;
}

/** Parses the fetched Place object (post fetchFields) into our address shape. */
export function parseGooglePlace(place: {
  formattedAddress?: string | null;
  addressComponents?: AddressComponent[] | null;
  location?: unknown;
  id?: string | null;
}): ParsedGooglePlace {
  const components = place.addressComponents ?? [];
  const streetNumber = componentText(components, "street_number");
  const route = componentText(components, "route");
  const location = place.location as { lat?: unknown; lng?: unknown } | undefined;

  return {
    formattedAddress: place.formattedAddress ?? "",
    addressLine1: [streetNumber, route].filter(Boolean).join(" "),
    addressLine2: "",
    city:
      componentText(components, "locality") ||
      componentText(components, "postal_town") ||
      componentText(components, "sublocality"),
    region: componentText(components, "administrative_area_level_1", true),
    postalCode: componentText(components, "postal_code"),
    country: componentText(components, "country", true) || "US",
    latitude: resolveLatLng(location?.lat),
    longitude: resolveLatLng(location?.lng),
    placeId: place.id ?? "",
  };
}
