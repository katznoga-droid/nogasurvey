import { CenteredShell } from "@/components/Logo";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SurveyForm } from "./SurveyForm";

export const dynamic = "force-dynamic";

export default async function SurveyPage({ params }: PageProps<"/survey/[token]">) {
  const { token } = await params;
  const { data: invite } = await supabaseAdmin()
    .from("invites")
    .select("name, responded_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <CenteredShell>
        <h1 className="text-2xl font-semibold">Link not found</h1>
        <p className="mt-3 text-slate">
          This survey link doesn&apos;t look right. Please use the link from your invitation email.
        </p>
      </CenteredShell>
    );
  }

  if (invite.responded_at) {
    return (
      <CenteredShell>
        <h1 className="text-2xl font-semibold">You&apos;ve already responded</h1>
        <p className="mt-3 text-slate">Thanks so much. We got your feedback and we care about you!</p>
      </CenteredShell>
    );
  }

  const firstName = invite.name.split(" ")[0];

  return (
    <CenteredShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Hi {firstName}, how are we doing?</h1>
      <p className="mt-2 text-slate">It takes less than a minute. Your answers help us improve.</p>
      <SurveyForm token={token} />
    </CenteredShell>
  );
}
