import { render } from "@react-email/components";
import { Resend } from "resend";
import { InviteEmail } from "@/emails/InviteEmail";
import { FollowUpEmail } from "@/emails/FollowUpEmail";

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

const from = () => process.env.EMAIL_FROM ?? "NogaSurvey <onboarding@resend.dev>";
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function sendInviteEmail({ to, name, token }: { to: string; name: string; token: string }) {
  const { error } = await resend().emails.send({
    from: from(),
    to,
    subject: "We would love your opinion",
    html: await render(<InviteEmail name={name} surveyUrl={`${siteUrl()}/survey/${token}`} />),
  });
  if (error) throw new Error(error.message);
}

export async function sendFollowUpEmail({ to, name, nps }: { to: string; name: string; nps: number }) {
  const positive = nps > 5;
  const { error } = await resend().emails.send({
    from: from(),
    to,
    subject: positive ? "We love that you love us! 🍪" : "We are sad to hear that 🍰",
    html: await render(<FollowUpEmail name={name} positive={positive} siteUrl={siteUrl()} />),
  });
  if (error) throw new Error(error.message);
}
