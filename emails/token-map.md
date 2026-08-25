# Email merge-field token map

Every placeholder in `emails/dist/*.html` must be replaced through **HighLevel's
merge-field picker** after import -- do not hand-type merge syntax, because
the exact token format can differ by field type and by account. This table
maps each placeholder to its webhook source key, the custom field it should
resolve to, and where it appears.

| Placeholder in HTML | Webhook source key (`estimate_created` / `option_selected`) | Suggested GHL custom field | Label | Example value | Appears in | Replace via picker? |
|---|---|---|---|---|---|---|
| `{{contact.first_name}}` | `first_name` | *(standard contact field)* | First Name | `Jordan` | Greeting | Yes -- standard field |
| `{{custom_fields.ge_project_address}}` | `formatted_address` | `ge_project_address` | GE Project Address | `1234 SE Example St, Portland, OR 97214` | Greeting | Yes |
| `{{location.phone_raw}}` | *(business config, not per-lead)* | *(location setting)* | Business phone | `+15039941227` | Not directly rendered -- CTA uses the hardcoded business number from config; present here only if an operator wants a merge-field alternative | Optional |
| `{{custom_fields.ge_silver_display_range}}` | `silver_display_range` | `ge_silver_display_range` | GE Silver Display Range | `$5,000–$5,600` | Silver card | Yes |
| `{{custom_fields.ge_silver_display_marker}}` | `silver_display_marker` | `ge_silver_display_marker` | GE Silver Estimate | `$5,350` | Silver card | Yes |
| `{{custom_fields.ge_gold_display_range}}` | `gold_display_range` | `ge_gold_display_range` | GE Gold Display Range | `$5,200–$6,000` | Gold card | Yes |
| `{{custom_fields.ge_gold_display_marker}}` | `gold_display_marker` | `ge_gold_display_marker` | GE Gold Estimate | `$5,650` | Gold card | Yes |
| `{{custom_fields.ge_platinum_display_range}}` | `platinum_display_range` | `ge_platinum_display_range` | GE Platinum Display Range | `$5,400–$6,200` | Platinum card | Yes |
| `{{custom_fields.ge_platinum_display_marker}}` | `platinum_display_marker` | `ge_platinum_display_marker` | GE Platinum Estimate | `$5,850` | Platinum card | Yes |
| `{{custom_fields.ge_selected_plan}}` | `selected_plan` | `ge_selected_plan` | GE Selected Plan | `gold` | Greeting (Focus templates only) | Yes |
| `{{custom_fields.ge_promotion_label}}` | `promotion_label` | `ge_promotion_label` | GE Promotion | `Spring Savings — $250 off` | Not shown unless promotions are enabled -- add manually to a template only when a promotion is live | Optional |

## Notes

- Card **range** and **marker** fields intentionally show `Starting at
  $2,500` as their literal *value* (not a separate mode field) when the
  displayed range collapses to the minimum -- the webhook already sends the
  final formatted string in `*_display_range`, so no conditional logic is
  needed inside HighLevel.
- The **All Options** template does not include a "You selected..." sentence
  and does not use `ge_selected_plan`.
- Never map a raw internal rate or raw (pre-rounding) total field into any
  customer-facing email. Those fields (`*_rate_low`, `*_rate_high`,
  `*_raw_low`, `*_raw_high`, `*_raw_estimate`) exist only for the sales
  team's own reporting inside GHL.
- See `docs/GHL_SETUP.md` for the full custom-field list (including
  attribution and consent fields that never appear in the email body).
