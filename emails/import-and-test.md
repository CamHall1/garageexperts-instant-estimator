# Importing and testing the emails in HighLevel

## Import

1. In the target sub-account, go to **Marketing -> Emails -> Templates** and
   create a new **Custom HTML** template.
2. Open `emails/dist/silver-focus.html` in a text editor, select all, copy.
3. Paste into HighLevel's HTML source editor (not the drag-and-drop
   builder -- the drag-and-drop builder will not preserve the table
   layout).
4. Set the template name (e.g. "GE Estimator -- Silver Focus") and Subject /
   Preheader from the table in `docs/EMAIL_IMPORT.md`.
5. Repeat for `gold-focus.html`, `platinum-focus.html`, and
   `all-options.html`.

## Replace merge fields

For every placeholder listed in `emails/token-map.md`:

1. Click into the HTML/text where the placeholder appears.
2. Delete the literal `{{...}}` text.
3. Use HighLevel's merge-field picker (usually a `{ }` or "Insert merge
   field" button in the editor toolbar) to insert the real token for that
   field.
4. Save and re-open the template to confirm the picker's token rendered
   correctly (HighLevel sometimes rewrites the internal token syntax).

Do this for all four templates before sending any test.

## Test with a populated contact

1. Create (or reuse) a test contact with the custom fields from
   `docs/GHL_SETUP.md` populated -- easiest is to send one real sample
   webhook payload with `scripts/send-ghl-test-payload.ts` and let
   Workflow A populate the contact, then edit `ge_selected_plan` etc.
   manually to try each branch.
2. Use HighLevel's "Send test email" against that contact for each of the
   four templates.
3. Confirm:
   - Subject and preheader match `docs/EMAIL_IMPORT.md`.
   - The apex card shows the correct plan (Silver/Gold/Platinum/Gold for
     All Options).
   - All three cards render even in the Focus templates.
   - The `tel:` button opens the dialer on a phone.
   - Images blocked: the email is still readable (no copy is baked into an
     image).
   - Dark mode: open in Gmail/Apple Mail with dark mode on and confirm text
     stays legible (the layout uses light backgrounds with dark text
     throughout, so it should not invert oddly).
   - HighLevel's compliance footer (physical address + unsubscribe) appears
     and was not deleted during editing.

## Confirm the selection/no-selection routing

1. Run one full estimator submission and let it sit for the configured
   `Wait 10 minutes` in Workflow A without selecting a plan -> confirm the
   All Options email arrives and `ge_selection_status` becomes
   `auto_sent_all_options`.
2. Run three more submissions, each time selecting a different plan
   immediately -> confirm the matching Focus email sends immediately via
   Workflow B, and that Workflow A's delayed step later finds
   `ge_selected_estimate_id` already set and does **not** also send the All
   Options email.

See `docs/GHL_SETUP.md` for the full workflow definitions this exercises.
