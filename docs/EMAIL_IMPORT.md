# Importing the estimate emails

Four templates live in [`emails/dist/`](../emails/dist), compiled from
[`emails/src/`](../emails/src) -- see [`emails/README.md`](../emails/README.md)
for how they're built. This document is the operator-facing checklist;
[`emails/import-and-test.md`](../emails/import-and-test.md) has the detailed
click-by-click steps.

## Subjects and preheaders

| Template | File | Subject | Preheader |
|---|---|---|---|
| Silver Focus | `silver-focus.html` | Your Silver Garage Floor Estimate | Your Silver estimate, plus Gold and Platinum for comparison. |
| Gold Focus | `gold-focus.html` | Your Gold Garage Floor Estimate | See your Most Popular Gold option and compare all three systems. |
| Platinum Focus | `platinum-focus.html` | Your Platinum Garage Floor Estimate | Your premium Brindle flake estimate and two comparison options. |
| All Options | `all-options.html` | Your Garage Floor Estimate: Three Options | Compare Silver, Gold, and Platinum Garage FX flooring options. |

These are the defaults in `config/estimator.config.ts#emailDefaults`; change
them there (and re-run `npm run build:emails`) rather than editing HTML
directly if you want the source of truth to stay accurate, or edit them
directly in HighLevel if this is a one-off subject-line test.

## 0. Rebuild with the production image URL

The "See the finish" product photos need an absolute HTTPS URL (email
clients can't resolve a relative path). Before importing into HighLevel:

```bash
NEXT_PUBLIC_APP_URL=https://YOUR-DEPLOYED-DOMAIN npm run build:emails
```

If you build without this, the images point at a placeholder
`https://YOUR-VERCEL-DOMAIN` and must be find-and-replaced manually in each
template's HTML before import.

## 1. Create a custom HTML template in HighLevel

For each of the four files: **Marketing -> Emails -> Templates -> New ->
Custom HTML**, paste the file's contents into the HTML source view (not the
visual/drag-and-drop builder -- it will not preserve the table layout),
then set the Subject and Preheader from the table above.

## 2. Replace every merge-field placeholder

Every `{{...}}`-looking placeholder in the HTML must be replaced **through
HighLevel's merge-field picker**, not by hand-typing text, because token
syntax can differ by field type and by account. The full list, with the
custom field each one should resolve to, is in
[`emails/token-map.md`](../emails/token-map.md).

## 3. Preview with a populated test contact

Use `npm run send:ghl-test` (see `docs/GHL_SETUP.md`) to populate a test
contact's custom fields, then use HighLevel's "Send test email" against that
contact for all four templates. Visual QA fixtures with realistic sample
data (a normal range, an all-"Starting at $2,500" small project, a
promotion-enabled example, and a long name/address) are pre-rendered in
[`emails/previews/`](../emails/previews) -- open them directly in a browser
for a fast layout check before you even touch HighLevel.

## 4. Confirm how the selection/no-selection workflow chooses a template

- No selection within 10 minutes -> **Workflow A** sends **All Options**.
- Selecting Silver/Gold/Platinum -> **Workflow B** sends the matching Focus
  template immediately.
- Selecting "Send Me All Three Options" -> **Workflow B** sends **All
  Options** immediately (this is a distinct, immediate path from Workflow
  A's 10-minute fallback).
- A selection made *after* the 10-minute window has already auto-sent All
  Options does not re-send anything else -- `ge_selection_status` is simply
  updated to `selected` and the plan-interest tag is applied for reporting.

Full workflow definitions: `docs/GHL_SETUP.md`.

## 5. Confirm compliance footer and unsubscribe behavior

HighLevel appends its own compliance footer (physical business address +
unsubscribe link) based on the sub-account's business profile settings.
Confirm in **Settings -> Business Profile** that the address and sender
email are correct, and never delete or override HighLevel's footer block
when editing a template -- our layout leaves it untouched by design (see the
comment at the bottom of `emails/src/layout.ts`).
