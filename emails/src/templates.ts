import { emailDefaults } from "../../config/estimator.config";
import { renderEmail, type EmailSpec } from "./layout";
import { T } from "./tokens";

const selectedFollowUp = `You selected ${T.selectedPlan} as the option that interests you most. We highlighted it below while keeping the other two available for comparison.`;
const allOptionsFollowUp =
  "We've included all three options so you can compare finish, durability, and estimated investment.";

const specs: Record<"silver" | "gold" | "platinum" | "allOptions", EmailSpec & { filename: string }> = {
  silver: {
    filename: "silver-focus.html",
    subject: emailDefaults.silver.subject,
    preheader: emailDefaults.silver.preheader,
    greetingExtra: selectedFollowUp,
    apexPlan: "silver",
  },
  gold: {
    filename: "gold-focus.html",
    subject: emailDefaults.gold.subject,
    preheader: emailDefaults.gold.preheader,
    greetingExtra: selectedFollowUp,
    apexPlan: "gold",
  },
  platinum: {
    filename: "platinum-focus.html",
    subject: emailDefaults.platinum.subject,
    preheader: emailDefaults.platinum.preheader,
    greetingExtra: selectedFollowUp,
    apexPlan: "platinum",
  },
  allOptions: {
    filename: "all-options.html",
    subject: emailDefaults.allOptions.subject,
    preheader: emailDefaults.allOptions.preheader,
    greetingExtra: allOptionsFollowUp,
    // Gold is Most Popular, so All Options still leads with Gold as the apex.
    apexPlan: "gold",
  },
};

export function renderAllEmails(): Array<{ filename: string; html: string }> {
  return Object.values(specs).map(({ filename, ...spec }) => ({
    filename,
    html: renderEmail(spec),
  }));
}
