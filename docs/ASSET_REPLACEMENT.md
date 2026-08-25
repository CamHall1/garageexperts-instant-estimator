# Replacing placeholder assets

## Provenance of the current photos and logo

`public/assets/photos/*` are real GarageExperts assets -- some pulled from
GarageExperts' own marketing PDFs (with the client's direction), some
provided directly by the client -- cropped/compressed for web use:

| File | Source | Detail |
|---|---|---|
| `intro-hero.jpg` | Client-provided (`IMG1 Header.jpg`) | Intro-screen header photo |
| `finished-floor-hero.jpg` | *The Garage Code* magazine (`com.garageexperts.files.fc` S3 bucket, 2026 edition), cover | Installed by GarageExperts® of North Houston -- used on the results-page showcase |
| `standard-flake.jpg` | *The Garage Code* magazine, page 16 | Blended Flake swatch ("Cookie") |
| `brindle-flake.jpg` | Client-provided (`IMG 4 Brindle Flake.jpg`) | Premium Brindle flake showcase photo |
| `double-topcoat.jpg` | Client-provided (`IMG 3 Double Topcoat.jpeg`) | Double Top Coat showcase photo |
| `cabinets-hero.jpg` | *The Garage Code: Cabinets Edition* magazine, cover | Cabinets cross-sell section |
| `logo.png` / `logo-mark.png` | Client-provided (`GE LOGO copy.png`) | Real GarageExperts logo, trimmed to transparent PNG. `logo-mark` is icon+wordmark only (header); `logo` is the full lockup with tagline (larger placements) |

The three concrete-condition icons remain the locally-drawn SVG placeholders
described below (the concrete step intentionally avoids photos entirely --
see `config/estimator.config.ts#assets` comment).

To swap in a different photo (a different flake color, a local install,
seasonal refresh, etc.), replace the file at the same path and keep the
same filename, or add a new file and update the path in `assets` below --
either way, no component changes are needed.

## Images

All image references live in one place:
[`config/estimator.config.ts`](../config/estimator.config.ts) `assets`:

```ts
export const assets = {
  introHero: "/assets/photos/intro-hero.jpg",
  heroFinishedFloor: "/assets/photos/finished-floor-hero.jpg",
  standardFlake: "/assets/photos/standard-flake.jpg",
  brindleFlake: "/assets/photos/brindle-flake.jpg",
  doubleTopcoat: "/assets/photos/double-topcoat.jpg",
  cabinetsHero: "/assets/photos/cabinets-hero.jpg",
  concreteNew: "/assets/placeholders/concrete-new.svg",
  concreteAverage: "/assets/placeholders/concrete-average.svg",
  concreteExcessive: "/assets/placeholders/concrete-excessive.svg",
  logoMark: "/assets/photos/logo-mark.png",
  logo: "/assets/photos/logo.png",
};
```

The remaining `public/assets/placeholders/*.svg` files (the three
concrete-condition icons) are intentionally obvious, locally-drawn
placeholders for anything not yet replaced with a real photo -- nothing was
scraped or hotlinked from the production GarageExperts website.

### Emails need an absolute image URL

The web app can use the relative paths above directly, but
`emails/src/layout.ts` resolves them against `NEXT_PUBLIC_APP_URL` (falling
back to a placeholder `https://YOUR-VERCEL-DOMAIN`) because email clients
fetch images over the network and can't resolve a relative path. Set
`NEXT_PUBLIC_APP_URL` to the real deployed domain before running
`npm run build:emails` for production, then re-import the templates -- see
`docs/EMAIL_IMPORT.md`.

To replace one:

1. Add the real file to `public/assets/` (any format -- JPG/PNG/WebP are
   fine; SVG is not required for the replacement).
2. Update the corresponding path in `assets` above.
3. Nothing else changes -- every component reads from this object rather
   than hardcoding a path.

Keep photography licensed for use in GarageExperts marketing. Do not pull
images directly from `garageexperts.com` (scraping/hotlinking production
assets was explicitly out of scope for this build).

## Fonts

The corporate site uses licensed **Nobel** / **Nobel Condensed** fonts,
which are not redistributed in this repository. `app/globals.css` defines a
hook:

```css
--font-heading-local: "";
--font-heading: var(--font-heading-local), "Arial Narrow",
  "Helvetica Neue Condensed", var(--font-body-sans), sans-serif;
```

Every heading in the app uses `font-[var(--font-heading)]` (Tailwind
arbitrary-value syntax), so once licensed font files are available:

1. Add the font files under `public/fonts/` (or wherever you keep static
   assets) and register them with `next/font/local` in `app/layout.tsx`,
   the same way `next/font/google` is used for the body font today.
2. Set `--font-heading-local` (in `app/globals.css`, on `:root`) to the
   `next/font/local` variable you created.
3. The condensed system-font fallback (`Arial Narrow` /
   `Helvetica Neue Condensed`) stays in the stack automatically, so nothing
   breaks visually on a device where the licensed font somehow fails to
   load.

The body font (currently Google's **Inter**, loaded via `next/font/google`
in `app/layout.tsx`) is not brand-restricted and can stay, or be swapped for
another clean sans-serif the same way.

## Brand colors

All six brand tokens are defined once, in two places that must stay in
sync: the CSS variables in `app/globals.css` (`--ge-black`, `--ge-green`,
etc., used by Tailwind arbitrary-value classes like
`bg-[var(--ge-green)]`) and the plain JS object `brandColors` in
`config/estimator.config.ts` (used by the email templates, which can't read
CSS custom properties). Update both together.
