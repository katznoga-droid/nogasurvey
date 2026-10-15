import { REALTIME_CHANNEL, REALTIME_EVENT } from "./constants";

/**
 * Tell connected dashboards that a new response arrived.
 * The payload carries no personal data; dashboards refetch through an authenticated server action.
 */
export async function broadcastNewResponse() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      messages: [{ topic: REALTIME_CHANNEL, event: REALTIME_EVENT, payload: { at: Date.now() } }],
    }),
  });
  if (!res.ok) {
    console.error("Realtime broadcast failed", res.status, await res.text());
  }
}
