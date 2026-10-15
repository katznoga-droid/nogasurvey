// Renders every customer email to email-previews/*.html for a quick look in the browser.
// Usage: npx tsx scripts/preview-emails.tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { render } from "@react-email/components";
import { InviteEmail } from "../src/emails/InviteEmail";
import { FollowUpEmail } from "../src/emails/FollowUpEmail";

// Relative path to public/ so images load when the previews are opened from disk.
const siteUrl = "../public";
const outDir = resolve("email-previews");
mkdirSync(outDir, { recursive: true });

const emails = {
  "1-invite.html": <InviteEmail name="Ava Thompson" surveyUrl="https://nogasurvey.vercel.app/survey/sample-token" />,
  "2-follow-up-cookies.html": <FollowUpEmail name="Ava Thompson" positive siteUrl={siteUrl} />,
  "3-follow-up-cake.html": <FollowUpEmail name="Ava Thompson" positive={false} siteUrl={siteUrl} />,
};

async function main() {
  for (const [file, element] of Object.entries(emails)) {
    writeFileSync(join(outDir, file), await render(element));
    console.log("wrote", join("email-previews", file));
  }
}

main();
