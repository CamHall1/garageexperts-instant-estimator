import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Renders visual-QA preview fixtures by substituting sample values into the
 * compiled emails/dist/*.html merge-field tokens. This is for eyeballing
 * layout only -- the actual merge-field mapping happens in HighLevel, see
 * docs/EMAIL_IMPORT.md.
 */

const distDir = path.resolve(__dirname, "../emails/dist");
const previewsDir = path.resolve(__dirname, "../emails/previews");
const photosDir = path.resolve(__dirname, "../public/assets/photos");

if (!existsSync(distDir) || readdirSync(distDir).length === 0) {
  console.error("No compiled emails found. Run `npm run build:emails` first.");
  process.exit(1);
}

// emails/dist is built against a real (or placeholder) deployed domain, so
// its <img> tags won't resolve when a preview is opened standalone. Each
// fixture folder gets its own copy of the photos with the src rewritten to
// a relative path, so previews always render correctly regardless of
// deployment status.
const PLACEHOLDER_IMAGE_HOST_PATTERN = /https:\/\/[^/]+\/assets\/photos\//g;

type Fixture = Record<string, string>;

const fixtures: Record<string, Fixture> = {
  "01-normal-three-range": {
    "{{contact.first_name}}": "Jordan",
    "{{custom_fields.ge_project_address}}": "1234 SE Example St, Portland, OR 97214",
    "{{custom_fields.ge_selected_plan}}": "Gold",
    "{{custom_fields.ge_silver_display_range}}": "$5,000–$5,600",
    "{{custom_fields.ge_silver_display_marker}}": "$5,350",
    "{{custom_fields.ge_gold_display_range}}": "$5,200–$6,000",
    "{{custom_fields.ge_gold_display_marker}}": "$5,650",
    "{{custom_fields.ge_platinum_display_range}}": "$5,400–$6,200",
    "{{custom_fields.ge_platinum_display_marker}}": "$5,850",
  },
  "02-small-project-starting-at": {
    "{{contact.first_name}}": "Casey",
    "{{custom_fields.ge_project_address}}": "88 NW Small Ave, Portland, OR 97209",
    "{{custom_fields.ge_selected_plan}}": "All Options",
    "{{custom_fields.ge_silver_display_range}}": "Starting at $2,500",
    "{{custom_fields.ge_silver_display_marker}}": "$2,500",
    "{{custom_fields.ge_gold_display_range}}": "Starting at $2,500",
    "{{custom_fields.ge_gold_display_marker}}": "$2,500",
    "{{custom_fields.ge_platinum_display_range}}": "Starting at $2,500",
    "{{custom_fields.ge_platinum_display_marker}}": "$2,500",
  },
  "03-promotion-enabled": {
    "{{contact.first_name}}": "Morgan",
    "{{custom_fields.ge_project_address}}": "4500 SE Promo Blvd, Portland, OR 97215",
    "{{custom_fields.ge_selected_plan}}": "Platinum",
    "{{custom_fields.ge_silver_display_range}}": "$4,750–$5,350",
    "{{custom_fields.ge_silver_display_marker}}": "$5,100",
    "{{custom_fields.ge_gold_display_range}}": "$4,950–$5,750",
    "{{custom_fields.ge_gold_display_marker}}": "$5,400",
    "{{custom_fields.ge_platinum_display_range}}": "$5,150–$5,950",
    "{{custom_fields.ge_platinum_display_marker}}": "$5,600",
    "{{custom_fields.ge_promotion_label}}": "Spring Savings — $250 off",
  },
  "04-long-name-and-address": {
    "{{contact.first_name}}": "Bartholomew-Alexander",
    "{{custom_fields.ge_project_address}}":
      "14832 Southeast Featherston Meadowbrook Terrace Court, Apartment 27-B, Portland, Oregon 97236",
    "{{custom_fields.ge_selected_plan}}": "Silver",
    "{{custom_fields.ge_silver_display_range}}": "$6,800–$7,650",
    "{{custom_fields.ge_silver_display_marker}}": "$7,200",
    "{{custom_fields.ge_gold_display_range}}": "$7,150–$8,100",
    "{{custom_fields.ge_gold_display_marker}}": "$7,600",
    "{{custom_fields.ge_platinum_display_range}}": "$7,450–$8,500",
    "{{custom_fields.ge_platinum_display_marker}}": "$7,950",
  },
};

function applyFixture(html: string, values: Fixture): string {
  let out = html;
  for (const [token, value] of Object.entries(values)) {
    out = out.split(token).join(value);
  }
  out = out.replace(PLACEHOLDER_IMAGE_HOST_PATTERN, "assets/");
  return out;
}

const templateFiles = readdirSync(distDir).filter((f) => f.endsWith(".html"));

for (const [fixtureName, values] of Object.entries(fixtures)) {
  const outDir = path.join(previewsDir, fixtureName);
  mkdirSync(outDir, { recursive: true });
  if (existsSync(photosDir)) {
    cpSync(photosDir, path.join(outDir, "assets"), { recursive: true });
  }
  for (const file of templateFiles) {
    const html = readFileSync(path.join(distDir, file), "utf8");
    writeFileSync(path.join(outDir, file), applyFixture(html, values), "utf8");
  }
  console.log(`Wrote emails/previews/${fixtureName}/ (${templateFiles.length} files)`);
}
