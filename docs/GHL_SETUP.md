# GoHighLevel setup

GoHighLevel (GHL) is the default, permanent system of record for leads. The
app sends two independent server-to-server webhook events; GHL turns them
into contact updates, tags, and (via two workflows) the estimate emails.

This document describes the exact configuration to build in the target
HighLevel sub-account. Nothing here happens automatically -- it must be
built once per sub-account.

## 1. Create the contact custom fields

In **Settings -> Custom Fields -> Contact**, create (or confirm) these
fields. Field *keys* below are suggestions -- what matters is that the key
you create matches what you map from the webhook sample in step 3.

| Field key | Label | Type |
|---|---|---|
| `ge_current_estimate_id` | GE Current Estimate ID | Single line |
| `ge_selected_estimate_id` | GE Selected Estimate ID | Single line |
| `ge_estimate_created_at` | GE Estimate Created At | Date/time or single line |
| `ge_selected_at` | GE Selected At | Date/time or single line |
| `ge_selected_plan` | GE Selected Plan | Single select or single line |
| `ge_selection_status` | GE Selection Status | Single line |
| `ge_project_address` | GE Project Address | Single line |
| `ge_address_source` | GE Address Source | Single line |
| `ge_square_footage` | GE Square Footage | Number |
| `ge_square_footage_tier` | GE Square Footage Tier | Single line |
| `ge_concrete_condition` | GE Concrete Condition | Single line |
| `ge_steps_present` | GE Steps Present | Checkbox or single line |
| `ge_stem_wall` | GE Stem Wall | Single line |
| `ge_final_position` | GE Price Position | Number |
| `ge_silver_display_range` | GE Silver Display Range | Single line |
| `ge_silver_display_marker` | GE Silver Estimate | Single line |
| `ge_silver_display_mode` | GE Silver Display Mode | Single line |
| `ge_gold_display_range` | GE Gold Display Range | Single line |
| `ge_gold_display_marker` | GE Gold Estimate | Single line |
| `ge_gold_display_mode` | GE Gold Display Mode | Single line |
| `ge_platinum_display_range` | GE Platinum Display Range | Single line |
| `ge_platinum_display_marker` | GE Platinum Estimate | Single line |
| `ge_platinum_display_mode` | GE Platinum Display Mode | Single line |
| `ge_promotion_label` | GE Promotion | Single line |
| `ge_sms_consent` | GE SMS Consent | Checkbox |
| `ge_consent_disclosure_version` | GE Consent Version | Single line |
| `ge_utm_source` | GE UTM Source | Single line |
| `ge_utm_medium` | GE UTM Medium | Single line |
| `ge_utm_campaign` | GE UTM Campaign | Single line |
| `ge_gclid` | GE GCLID | Single line |
| `ge_fbclid` | GE FBCLID | Single line |

Optionally also store the raw numeric totals (`silver_raw_low`,
`gold_raw_estimate`, etc.) in additional custom or opportunity fields if the
sales team wants reporting -- never map those into an email.

Apply a tag `instant-estimator-lead` on estimate creation, and a
plan-specific tag (`estimator-interest-silver` / `-gold` / `-platinum`) on
selection.

## 2. Create the two inbound webhooks

Create two **Inbound Webhook** workflow triggers (Workflows -> Create
Workflow -> Trigger: *Inbound Webhook*):

- One for `estimate_created`
- One for `option_selected`

Each gives you a unique URL. Copy them into Vercel as:

```
GHL_ESTIMATE_CREATED_WEBHOOK_URL=...
GHL_OPTION_SELECTED_WEBHOOK_URL=...
```

Reference: [HighLevel inbound webhook trigger docs](https://help.gohighlevel.com/support/solutions/articles/48001237383-how-to-use-the-inbound-webhook-workflow-premium-trigger).

## 3. Send one sample payload and map fields

With the webhook URLs set in `.env.local`, run:

```bash
npm run send:ghl-test estimate_created
npm run send:ghl-test option_selected -- --plan=gold
```

Each prints the exact JSON it sent. In the HighLevel workflow builder,
use "Load Sample Payload" (or trigger it live once) so every field above is
available in the field-mapping picker, then map each webhook key to its
custom field from the table in step 1.

The payload is **flat** (snake_case keys, no nested objects, no arrays,
booleans as `true`/`false`, ISO 8601 UTC timestamps) specifically so
HighLevel's mapping UI can bind every value directly.

## 4. Workflow A: estimate created

Trigger: `GHL_ESTIMATE_CREATED_WEBHOOK_URL`.

1. Resolve or create the contact by normalized email + phone.
2. Update: name, project address, consent fields, all five project
   answers, all three plans' display range/marker/mode, attribution
   fields, `ge_current_estimate_id`, `ge_estimate_created_at`.
3. Apply tag `instant-estimator-lead`.
4. **Do not** send an estimate email yet.
5. **Wait 10 minutes** ([Wait action docs](https://help.gohighlevel.com/support/solutions/articles/155000002470-workflow-action-wait)).
6. **If/Else**: if `ge_current_estimate_id` (the contact's *current* value,
   re-read after the wait) no longer equals this trigger's `estimate_id` --
   stop. A newer estimate has superseded this one.
7. **If/Else**: if `ge_selected_estimate_id` equals this trigger's
   `estimate_id` -- stop. Workflow B already sent a selected-focus email for
   this exact estimate.
8. Otherwise: send the **All Options** template.
9. Set `ge_selection_status = auto_sent_all_options`.

The two ID comparisons in steps 6-7 are the whole point of this workflow:
they stop an old, delayed "Workflow A" from emailing a stale quote after the
homeowner has already started a newer estimate, or already picked a plan.

### If HighLevel can't compare a stored field to the trigger value directly

Some HighLevel plans' If/Else action can only compare a custom field to a
**literal value**, not to another field captured at trigger time. If your
workflow builder can't do "custom field equals value from this trigger":

- **Preferred fallback**: add a lightweight signed status-check callback
  (a lightweight authenticated Route Handler you deploy specifically for
  this, e.g. `/api/ghl/estimate-status?estimateId=...`, protected by a
  shared secret query param) that Workflow A calls after the wait via a
  "Webhook" action, and branches on its JSON response instead of an
  in-workflow field comparison. This keeps the safety check server-side and
  accurate even if HighLevel's UI can't express it directly.
- **Acceptable fallback**: if you enable `ESTIMATE_STORAGE_PROVIDER=postgres`,
  the same status can be read directly from the `estimates` table.
- **Do not** ship a version that blindly sends both emails -- that is
  exactly the double-send this workflow exists to prevent.

## 5. Workflow B: option selected

Trigger: `GHL_OPTION_SELECTED_WEBHOOK_URL`.

1. Resolve the same contact by email + phone.
2. Update the full estimate snapshot (same fields as Workflow A -- this
   payload repeats everything so Workflow B never depends on array data or
   an external lookup).
3. Set `ge_current_estimate_id` and `ge_selected_estimate_id` to the
   incoming `estimate_id`.
4. Set `ge_selected_plan`, `ge_selected_at`, `ge_selection_status`.
5. Apply the matching plan-interest tag.
6. Branch on `selected_plan`:
   - `silver` -> send **Silver Focus**
   - `gold` -> send **Gold Focus**
   - `platinum` -> send **Platinum Focus**
   - `all_options` -> send **All Options**
7. **Do not** wait 10 minutes in this workflow -- send immediately.

## 6. Import checklist

- [ ] All contact custom fields created/confirmed (step 1).
- [ ] Both inbound webhook triggers created (step 2).
- [ ] Both webhook URLs set in Vercel project settings (Production *and*
      Preview environments).
- [ ] Sample payloads sent and every field mapped (step 3).
- [ ] All four HTML templates imported (see `docs/EMAIL_IMPORT.md`).
- [ ] Every merge-field placeholder replaced through the picker
      (`emails/token-map.md`).
- [ ] Business profile, physical address, sender domain, unsubscribe
      behavior, and sending email confirmed in HighLevel's email settings.
- [ ] One full no-selection run (10-minute wait) tested end to end.
- [ ] Three selected-package runs tested end to end (one per plan).
- [ ] Rotate a webhook URL immediately if it is ever accidentally shared
      publicly (delete the trigger, recreate it, update the Vercel env var).
