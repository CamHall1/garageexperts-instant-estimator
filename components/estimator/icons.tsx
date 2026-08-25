/** Minimal line icons used on the estimator's selectable answer cards. */

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconSlabClean() {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
    </svg>
  );
}

export function IconSlabModerateCracks() {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M8 6l3 6-2 6" />
    </svg>
  );
}

export function IconSlabHeavyCracks() {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M7 6l3 5-2 3 3 4" />
      <path d="M16 6l-2 4 3 3-2 5" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconWallNone() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M3 20h18" />
      <path d="M4 20V10l8-6 8 6v10" />
    </svg>
  );
}

export function IconWallLow() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M3 20h18" />
      <path d="M4 20V10l8-6 8 6v10" />
      <path d="M6 20v-3h12v3" />
    </svg>
  );
}

export function IconWallHigh() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M3 20h18" />
      <path d="M4 20V10l8-6 8 6v10" />
      <path d="M6 20v-6h12v6" />
    </svg>
  );
}

export function IconHelp() {
  return (
    <svg {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.75c0 1.75-2.4 2-2.4 3.5" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}
