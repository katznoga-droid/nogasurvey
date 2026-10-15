"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CUSTOMER_TYPE_VALUES } from "@/lib/constants";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendFollowUpEmail } from "@/lib/email";
import { broadcastNewResponse } from "@/lib/realtime";

const schema = z.object({
  nps: z.coerce
    .number({ message: "Please pick a score from 1 to 10." })
    .int()
    .min(1, "Please pick a score from 1 to 10.")
    .max(10, "Please pick a score from 1 to 10."),
  happy: z.enum(["yes", "no"], { message: "Please choose Yes or No." }),
  feedback: z.string().max(2000, "Please keep feedback under 2,000 characters.").optional(),
  customer_type: z.enum(CUSTOMER_TYPE_VALUES, { message: "Please choose a customer type." }),
});

export type SurveyState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof schema>, string>>;
  values?: Record<string, string>;
};

export async function submitSurvey(
  token: string,
  _prev: SurveyState,
  formData: FormData,
): Promise<SurveyState> {
  const raw = {
    nps: String(formData.get("nps") ?? ""),
    happy: String(formData.get("happy") ?? ""),
    feedback: String(formData.get("feedback") ?? ""),
    customer_type: String(formData.get("customer_type") ?? ""),
  };

  const parsed = schema.safeParse({ ...raw, nps: raw.nps || undefined });
  if (!parsed.success) {
    const fieldErrors: SurveyState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof schema>;
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors, values: raw };
  }

  const db = supabaseAdmin();
  const { data: invite } = await db
    .from("invites")
    .select("id, name, email, responded_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { error: "This survey link is not valid.", values: raw };
  if (invite.responded_at) redirect(`/survey/${token}/thank-you`);

  const { nps, happy, feedback, customer_type } = parsed.data;
  const { data: response, error } = await db
    .from("responses")
    .insert({
      invite_id: invite.id,
      nps,
      happy: happy === "yes",
      feedback: feedback?.trim() || null,
      customer_type,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique violation: this invite was already submitted (e.g. double-click).
    if (error.code === "23505") redirect(`/survey/${token}/thank-you`);
    console.error("Failed to save response", error);
    return { error: "Something went wrong saving your answers. Please try again.", values: raw };
  }

  await db.from("invites").update({ responded_at: new Date().toISOString() }).eq("id", invite.id);

  // Runs after the redirect is sent, so the customer isn't kept waiting.
  after(async () => {
    await broadcastNewResponse();
    try {
      await sendFollowUpEmail({ to: invite.email, name: invite.name, nps });
      await db
        .from("responses")
        .update({ follow_up_sent_at: new Date().toISOString() })
        .eq("id", response.id);
    } catch (e) {
      console.error("Follow-up email failed", e);
    }
  });

  redirect(`/survey/${token}/thank-you`);
}
