"use server";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { sendInviteEmail } from "@/lib/email";
import { createSessionToken, SESSION_MAX_AGE } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export type LoginState = { error?: string; username?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const okUser = safeEqual(username, process.env.ADMIN_USERNAME ?? "admin");
  const okPass = safeEqual(password, process.env.ADMIN_PASSWORD ?? "");

  if (!okUser || !okPass) {
    return { error: "Incorrect username or password.", username };
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export type ResponseRow = {
  id: string;
  nps: number;
  happy: boolean;
  feedback: string | null;
  customer_type: string;
  created_at: string;
  name: string | null;
  email: string | null;
};

export async function getResponses(): Promise<ResponseRow[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin()
    .from("responses")
    .select("id, nps, happy, feedback, customer_type, created_at, invites(name, email)")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => {
    const inv = (Array.isArray(r.invites) ? r.invites[0] : r.invites) as
      | { name: string; email: string }
      | null;
    return {
      id: r.id,
      nps: r.nps,
      happy: r.happy,
      feedback: r.feedback,
      customer_type: r.customer_type,
      created_at: r.created_at,
      name: inv?.name ?? null,
      email: inv?.email ?? null,
    };
  });
}

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email."),
});

export type InviteState = { ok?: boolean; error?: string; message?: string };

export async function sendInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireAdmin();
  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email } = parsed.data;
  const token = randomBytes(18).toString("base64url");
  const db = supabaseAdmin();
  const { data: invite, error } = await db
    .from("invites")
    .insert({ token, name, email })
    .select("id")
    .single();
  if (error) return { error: "Could not create the invite. Please try again." };

  try {
    await sendInviteEmail({ to: email, name, token });
  } catch (e) {
    await db.from("invites").delete().eq("id", invite.id);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { error: `Email could not be sent: ${msg}` };
  }

  return { ok: true, message: `Invite sent to ${email}.` };
}
