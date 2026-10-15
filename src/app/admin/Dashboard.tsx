"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  BUCKET_COLORS,
  CUSTOMER_TYPES,
  REALTIME_CHANNEL,
  REALTIME_EVENT,
  customerTypeLabel,
  npsBucket,
} from "@/lib/constants";
import { getResponses, sendInvite, type InviteState, type ResponseRow } from "./actions";
import { HappyChart, NpsByTypeChart, NpsDistributionChart, ResponsesOverTimeChart } from "./Charts";

// Browser client used only for the realtime subscription; created once per page.
let realtimeClient: SupabaseClient | undefined;
function getRealtimeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return undefined;
  realtimeClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return realtimeClient;
}

export function Dashboard({ initial }: { initial: ResponseRow[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [live, setLive] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const knownIds = useRef(new Set(initial.map((r) => r.id)));

  // Realtime: a broadcast ping triggers an authenticated refetch.
  useEffect(() => {
    const supabase = getRealtimeClient();
    if (!supabase) return;

    const refresh = async () => {
      try {
        const next = await getResponses();
        const added = next.filter((r) => !knownIds.current.has(r.id)).map((r) => r.id);
        knownIds.current = new Set(next.map((r) => r.id));
        setRows(next);
        if (added.length) {
          setFreshIds(new Set(added));
          setTimeout(() => setFreshIds(new Set()), 3000);
        }
      } catch (e) {
        console.error("Refresh failed", e);
      }
    };

    const channel = supabase
      .channel(REALTIME_CHANNEL)
      .on("broadcast", { event: REALTIME_EVENT }, refresh)
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
        // Catch anything that arrived while we were (re)connecting.
        if (status === "SUBSCRIBED") refresh();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.customer_type === filter)),
    [rows, filter],
  );

  const kpis = useMemo(() => {
    const n = filtered.length;
    if (!n) return { n: 0, avg: "–", nps: "–", happy: "–" };
    const avg = filtered.reduce((s, r) => s + r.nps, 0) / n;
    const promoters = filtered.filter((r) => r.nps >= 9).length;
    const detractors = filtered.filter((r) => r.nps <= 6).length;
    const nps = Math.round(((promoters - detractors) / n) * 100);
    const happy = Math.round((filtered.filter((r) => r.happy).length / n) * 100);
    return { n, avg: avg.toFixed(1), nps: `${nps > 0 ? "+" : ""}${nps}`, happy: `${happy}%` };
  }, [filtered]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy sm:text-3xl">Survey dashboard</h1>
          <p className="mt-1 text-slate">Customer feedback at a glance.</p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            live ? "bg-teal/10 text-teal-dark" : "bg-line-soft text-slate"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-60" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? "bg-teal" : "bg-slate/50"}`} />
          </span>
          {live ? "Live" : "Connecting…"}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="filter" className="font-medium text-navy">
          Filter by customer type:
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-md border border-line bg-white px-4 py-2 text-navy focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:w-72"
        >
          <option value="all">All customer types</option>
          {CUSTOMER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total responses" value={String(kpis.n)} />
        <Kpi label="Average NPS" value={kpis.avg} hint="out of 10" />
        <Kpi label="NPS score" value={kpis.nps} hint="% promoters − % detractors" />
        <Kpi label="Happy customers" value={kpis.happy} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-navy">Charts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <NpsDistributionChart rows={filtered} />
            <HappyChart rows={filtered} />
            <ResponsesOverTimeChart rows={filtered} />
            <NpsByTypeChart rows={filtered} />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <InviteCard />
          <div className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-navy">List</h2>
              <span className="text-sm text-slate">{filtered.length} responses</span>
            </div>
            <ul className="max-h-[720px] divide-y divide-line-soft overflow-y-auto rounded-lg border border-line bg-white">
              {filtered.length === 0 && <li className="p-6 text-center text-slate">No responses yet.</li>}
              {filtered.map((r) => (
                <ResponseItem
                  key={r.id}
                  row={r}
                  fresh={freshIds.has(r.id)}
                  open={expanded === r.id}
                  onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                />
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-[0_1px_4px_rgba(33,51,67,0.06)] sm:p-5">
      <p className="text-sm text-slate">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate">{hint}</p>}
    </div>
  );
}

function ResponseItem({
  row,
  fresh,
  open,
  onToggle,
}: {
  row: ResponseRow;
  fresh: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const color = BUCKET_COLORS[npsBucket(row.nps)];
  return (
    <li className={fresh ? "animate-flash" : undefined}>
      <button onClick={onToggle} className="w-full px-4 py-3 text-left transition hover:bg-canvas" aria-expanded={open}>
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
            title={`NPS ${row.nps}`}
          >
            {row.nps}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-medium text-navy">{row.name ?? "Anonymous"}</p>
              <span className="shrink-0 text-xs text-slate">
                {new Date(row.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-line-soft px-2 py-0.5 text-navy-soft">
                {customerTypeLabel(row.customer_type)}
              </span>
              <span className={row.happy ? "text-teal-dark" : "text-detractor"}>
                {row.happy ? "😊 Happy" : "☹️ Not happy"}
              </span>
              {fresh && <span className="rounded-full bg-brand px-2 py-0.5 font-medium text-white">New</span>}
            </div>
            {row.feedback && (
              <p className={`mt-1.5 text-sm text-slate ${open ? "" : "line-clamp-2"}`}>{row.feedback}</p>
            )}
            {open && row.email && <p className="mt-1.5 text-xs text-slate">{row.email}</p>}
          </div>
        </div>
      </button>
    </li>
  );
}

function InviteCard() {
  const [state, action, pending] = useActionState<InviteState, FormData>(sendInvite, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-[0_1px_4px_rgba(33,51,67,0.06)]">
      <h2 className="text-lg font-semibold text-navy">Send a survey invite</h2>
      <p className="text-sm text-slate">The customer gets an email with their unique survey link.</p>
      <form ref={formRef} action={action} className="mt-4 space-y-3">
        <input
          name="name"
          placeholder="Customer name"
          required
          className="w-full rounded-md border border-line px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <input
          name="email"
          type="email"
          placeholder="customer@company.com"
          required
          className="w-full rounded-md border border-line px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send invite"}
        </button>
        {state.message && <p className="text-sm text-teal-dark">{state.message}</p>}
        {state.error && <p className="text-sm text-detractor">{state.error}</p>}
      </form>
    </div>
  );
}
