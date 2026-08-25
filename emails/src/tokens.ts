/**
 * GHL merge-field tokens used across all four email templates. These are
 * placeholders to be mapped through HighLevel's merge-field picker after
 * import -- see ../token-map.md for the full source -> field -> label map.
 */
export const T = {
  firstName: "{{contact.first_name}}",
  projectAddress: "{{custom_fields.ge_project_address}}",
  phoneRaw: "{{location.phone_raw}}",

  silverRange: "{{custom_fields.ge_silver_display_range}}",
  silverMarker: "{{custom_fields.ge_silver_display_marker}}",
  goldRange: "{{custom_fields.ge_gold_display_range}}",
  goldMarker: "{{custom_fields.ge_gold_display_marker}}",
  platinumRange: "{{custom_fields.ge_platinum_display_range}}",
  platinumMarker: "{{custom_fields.ge_platinum_display_marker}}",

  selectedPlan: "{{custom_fields.ge_selected_plan}}",
  promotionLabel: "{{custom_fields.ge_promotion_label}}",
} as const;
