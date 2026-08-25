import { assets, brandColors, business, cabinetsCrossSell, emailCardDisclaimer, packages } from "../../config/estimator.config";
import { T } from "./tokens";

/**
 * Table-based, inline-CSS email layout. No JS, forms, grid/flexbox,
 * background video, or remote scripts -- see docs/EMAIL_IMPORT.md for the
 * full compatibility checklist this satisfies (Outlook/Gmail/Apple Mail).
 */

const MAX_WIDTH = 640;

/**
 * Email clients fetch images over the network, so relative paths (fine on
 * the web app itself) won't resolve here -- everything needs an absolute
 * HTTPS URL. Update this once the app is deployed (or set
 * NEXT_PUBLIC_APP_URL before running `npm run build:emails`); see
 * docs/EMAIL_IMPORT.md.
 */
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://YOUR-VERCEL-DOMAIN";

function assetUrl(path: string): string {
  return `${ASSET_BASE_URL}${path}`;
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface CardSpec {
  plan: "silver" | "gold" | "platinum";
  rangeToken: string;
  markerToken: string;
}

function planCard({ plan, rangeToken, markerToken }: CardSpec): string {
  const content = packages[plan];
  const accent = plan === "gold" ? brandColors.green : plan === "platinum" ? brandColors.darkGray : brandColors.supportingGray;

  // Always fills its containing cell/div -- the caller controls actual
  // rendered width (full-width apex row vs. ~288px comparison column).
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:2px solid ${accent};border-radius:16px;background:#ffffff;">
    <tr>
      <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;">
        ${
          plan === "gold"
            ? `<div style="display:inline-block;background:${brandColors.green};color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;border-radius:999px;padding:4px 10px;margin-bottom:8px;">Most Popular</div><br/>`
            : ""
        }
        <div style="font-size:18px;font-weight:bold;color:${brandColors.darkGray};">${esc(content.name)}</div>
        <div style="font-size:22px;font-weight:bold;color:${brandColors.black};margin-top:8px;word-break:break-word;overflow-wrap:anywhere;">${rangeToken}</div>
        <div style="font-size:13px;color:${brandColors.supportingGray};margin-top:2px;word-break:break-word;overflow-wrap:anywhere;">Your estimate: <strong style="color:${brandColors.darkGray};">${markerToken}</strong></div>
        <div style="font-size:13px;color:${brandColors.darkGray};margin-top:10px;">${esc(content.emailValueStatement)}</div>
        <ul style="margin:10px 0 0 18px;padding:0;font-size:13px;color:${brandColors.darkGray};">
          ${content.emailFeatures.map((f) => `<li style="margin-bottom:4px;">${esc(f)}</li>`).join("\n          ")}
        </ul>
        <div style="font-size:11px;color:${brandColors.supportingGray};margin-top:12px;">${esc(emailCardDisclaimer)}</div>
      </td>
    </tr>
  </table>`;
}

function triangle(apexPlan: "silver" | "gold" | "platinum"): string {
  const cardFor = (plan: "silver" | "gold" | "platinum") =>
    planCard({
      plan,
      rangeToken: plan === "silver" ? T.silverRange : plan === "gold" ? T.goldRange : T.platinumRange,
      markerToken: plan === "silver" ? T.silverMarker : plan === "gold" ? T.goldMarker : T.platinumMarker,
    });

  const others = (["silver", "gold", "platinum"] as const).filter((p) => p !== apexPlan);

  return `
  <!-- Triangle composition: apex row, then two comparison cards -->
  <tr>
    <td style="padding:0 24px 16px 24px;" align="center">
      ${cardFor(apexPlan)}
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 24px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
        <tr>
          <td class="ge-stack" width="49%" valign="top" style="width:49%;">
            ${cardFor(others[0])}
          </td>
          <td width="2%" style="width:2%;font-size:0;line-height:0;">&nbsp;</td>
          <td class="ge-stack" width="49%" valign="top" style="width:49%;">
            ${cardFor(others[1])}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function educationSections(): string {
  return `
  <tr>
    <td style="padding:8px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
      <h2 style="font-size:18px;color:${brandColors.black};margin:24px 0 8px 0;">Why Garage FX&reg;</h2>
      <p style="font-size:13px;color:${brandColors.darkGray};line-height:1.6;margin:0;">
        Garage FX&reg; combines a fusing epoxy primer/base with a full-broadcast flake finish and a
        polyaspartic topcoat for a durable, easy-to-clean residential garage floor.
      </p>

      <h2 style="font-size:18px;color:${brandColors.black};margin:24px 0 8px 0;">What happens next</h2>
      <ol style="font-size:13px;color:${brandColors.darkGray};line-height:1.7;margin:0;padding-left:18px;">
        <li>A local GarageExperts professional reviews your project.</li>
        <li>An on-site inspection confirms dimensions and concrete conditions.</li>
        <li>A written proposal provides the final scope and price.</li>
      </ol>

      <h2 style="font-size:18px;color:${brandColors.black};margin:24px 0 8px 0;">Warranty &amp; trust</h2>
      <ul style="font-size:13px;color:${brandColors.darkGray};line-height:1.7;margin:0;padding-left:18px;">
        <li>Locally owned service, backed by a national brand with 100+ locations nationwide.</li>
        <li>American-made products.</li>
        <li>More than 80 million square feet installed nationally.</li>
        <li>More than 140 color and style options nationally.</li>
        <li>Residential material warranty subject to <a href="${business.warrantyUrl}" style="color:${brandColors.green};">official terms</a>.</li>
      </ul>
    </td>
  </tr>`;
}

interface ShowcasePhoto {
  src: string;
  alt: string;
  caption: string;
}

const SHOWCASE_PHOTOS: ShowcasePhoto[] = [
  { src: assets.heroFinishedFloor, alt: "Finished Garage FX floor", caption: "Finished Garage FX&reg; floor" },
  { src: assets.standardFlake, alt: "Standard chip flake blend close-up", caption: "Standard chip flake" },
  { src: assets.doubleTopcoat, alt: "Double polyaspartic topcoat gloss finish", caption: "Double polyaspartic topcoat" },
  { src: assets.brindleFlake, alt: "Premium Brindle flake close-up", caption: "Premium Brindle flake" },
];

function photoCell(photo: ShowcasePhoto): string {
  return `
      <td class="ge-stack" width="49%" valign="top" style="width:49%;padding-bottom:12px;">
        <img src="${assetUrl(photo.src)}" width="278" height="185" alt="${photo.alt}" style="display:block;width:100%;max-width:278px;height:auto;border:0;border-radius:12px;" />
        <div style="font-size:12px;color:${brandColors.supportingGray};margin-top:6px;text-align:center;">${photo.caption}</div>
      </td>`;
}

function productShowcase(): string {
  return `
  <tr>
    <td style="padding:8px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
      <h2 style="font-size:18px;color:${brandColors.black};margin:24px 0 12px 0;">See the finish</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;">
        <tr>
          ${photoCell(SHOWCASE_PHOTOS[0])}
          <td width="2%" style="width:2%;font-size:0;line-height:0;">&nbsp;</td>
          ${photoCell(SHOWCASE_PHOTOS[1])}
        </tr>
        <tr>
          ${photoCell(SHOWCASE_PHOTOS[2])}
          <td width="2%" style="width:2%;font-size:0;line-height:0;">&nbsp;</td>
          ${photoCell(SHOWCASE_PHOTOS[3])}
        </tr>
      </table>
    </td>
  </tr>`;
}

function cabinetsSection(): string {
  return `
  <tr>
    <td style="padding:24px 24px 0 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid ${brandColors.lightGray};border-radius:16px;">
        <tr>
          <td>
            <img src="${assetUrl(assets.cabinetsHero)}" width="592" height="280" alt="Custom GarageExperts cabinet and storage system" style="display:block;width:100%;height:auto;border:0;border-radius:14px 14px 0 0;" />
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 24px 20px;font-family:Arial,Helvetica,sans-serif;">
            <h2 style="font-size:18px;color:${brandColors.black};margin:0 0 8px 0;">${esc(cabinetsCrossSell.heading)}</h2>
            <p style="font-size:13px;color:${brandColors.darkGray};line-height:1.6;margin:0 0 12px 0;">${esc(cabinetsCrossSell.body)}</p>
            <ul style="font-size:13px;color:${brandColors.darkGray};line-height:1.7;margin:0 0 16px 0;padding-left:18px;">
              ${cabinetsCrossSell.bullets.map((b) => `<li>${esc(b)}</li>`).join("\n              ")}
            </ul>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${brandColors.black}" style="border-radius:999px;">
                  <a href="${cabinetsCrossSell.ctaUrl}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">
                    ${esc(cabinetsCrossSell.ctaLabel)}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function footer(): string {
  return `
  <tr>
    <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;" align="center">
      <!-- Bulletproof tel: CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" bgcolor="${brandColors.green}" style="border-radius:999px;">
            <a href="tel:${business.phoneE164}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">
              Call GarageExperts Now
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:${brandColors.supportingGray};line-height:1.6;margin:20px 0 0 0;">
        This instant estimate is a general project-total range based on the answers submitted.
        Measurements, concrete condition, project access, repairs, and other site factors must be
        verified during a final inspection before an accurate written quote can be provided.
      </p>
      <p style="font-size:12px;color:${brandColors.darkGray};margin:16px 0 0 0;">
        ${esc(business.name)}<br/>
        <a href="${business.websiteUrl}" style="color:${brandColors.green};">${business.websiteUrl.replace(/^https?:\/\//, "")}</a>
        &middot;
        <a href="${business.warrantyUrl}" style="color:${brandColors.green};">Warranty</a>
      </p>
      <!-- {{location.name}} / {{location.address}} and the unsubscribe link are
           inserted automatically by HighLevel's compliance footer -- do not
           remove or replace this block on import. -->
    </td>
  </tr>`;
}

export interface EmailSpec {
  subject: string;
  preheader: string;
  greetingExtra: string;
  apexPlan: "silver" | "gold" | "platinum";
}

export function renderEmail(spec: EmailSpec): string {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${esc(spec.subject)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td { font-family: Arial, Helvetica, sans-serif; }
    /* Merge-field tokens (e.g. {{custom_fields.ge_gold_display_range}}) are
       long, space-free strings until HighLevel substitutes real values;
       force-wrap everywhere so a preview never overflows the 640px layout. */
    body, table, td, div, p, span, a, li { word-break: break-word; overflow-wrap: anywhere; }
    @media (max-width: 480px) {
      .ge-stack { display: block !important; width: 100% !important; padding-bottom: 12px; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${brandColors.lightGray};">
  <!-- Preheader (hidden, used for inbox preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${esc(spec.preheader)}
    ${"&#8203;".repeat(40)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brandColors.lightGray};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="${MAX_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${MAX_WIDTH}px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${brandColors.black};padding:20px 24px;" align="center">
              <span style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;">${esc(business.shortName)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;">
              <p style="font-size:15px;color:${brandColors.darkGray};line-height:1.6;margin:0;">
                Hi ${T.firstName},<br/><br/>
                Thanks for using the GarageExperts of Portland instant estimator. Based on the project
                details you shared for ${T.projectAddress}, here are three Garage FX flooring options
                for your space.
              </p>
              <p style="font-size:15px;color:${brandColors.darkGray};line-height:1.6;margin:12px 0 0 0;">
                ${spec.greetingExtra}
              </p>
            </td>
          </tr>
          ${triangle(spec.apexPlan)}
          ${educationSections()}
          ${productShowcase()}
          ${cabinetsSection()}
          ${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
