# GarageExperts Instant Estimator -- Email Package

Four import-ready HTML email bodies for GoHighLevel, generated from a small
TypeScript source (not hand-maintained HTML) so copy, colors, and features
stay in sync with `config/estimator.config.ts`.

## Layout

```
emails/
  src/            TypeScript source -- edit these, not emails/dist
    tokens.ts     GHL merge-field placeholder strings
    layout.ts     Shared table-based HTML layout (triangle cards, footer, CTA)
    templates.ts  The 4 template specs (subject/preheader/apex plan)
  dist/           Compiled, import-ready HTML -- generated, do not hand-edit
    silver-focus.html
    gold-focus.html
    platinum-focus.html
    all-options.html
  previews/       Visual-QA fixtures with sample data substituted for tokens
  token-map.md    Every placeholder -> GHL custom field mapping
  import-and-test.md   Step-by-step HighLevel import + test checklist
```

## Building

```bash
NEXT_PUBLIC_APP_URL=https://YOUR-DEPLOYED-DOMAIN npm run build:emails
npm run preview:emails    # writes emails/previews/<fixture>/*.html
```

`NEXT_PUBLIC_APP_URL` sets the base URL for the product-showcase photos in
the "See the finish" section -- email clients fetch images over the
network, so a relative path won't resolve. Without it, the build falls back
to a placeholder `https://YOUR-VERCEL-DOMAIN` that you must find-and-replace
before importing into HighLevel.

Run `build:emails` after changing `config/estimator.config.ts` (package
copy, brand colors, phone number, warranty link) or `emails/src/*` -- the
committed `emails/dist/*.html` files are what gets imported into HighLevel,
so they must be regenerated and re-imported after any content change.

## Design constraints (why the HTML looks the way it does)

- Table-based layout with inline CSS throughout -- Outlook's Word rendering
  engine ignores most `<style>` block CSS and all Flexbox/Grid.
- Max content width 640px, `table-layout:fixed` on the two-column comparison
  row, and `word-break`/`overflow-wrap` everywhere, so a long merge-field
  value (or a long address/name once substituted) wraps instead of
  overflowing the layout.
- No JavaScript, forms, background video, or remote scripts.
- A hidden preheader `<div>` drives the inbox preview text.
- The `tel:` CTA is a table-wrapped link (bulletproof button pattern), not a
  styled `<button>`.
- Media queries in `<style>` are progressive enhancement only (mobile
  stacking of the two comparison cards); the base layout already works
  without them.

See `docs/EMAIL_IMPORT.md` for the HighLevel import steps and
`docs/PRICING_AND_RULES.md` for how the range/marker values are computed
before they ever reach GHL.
