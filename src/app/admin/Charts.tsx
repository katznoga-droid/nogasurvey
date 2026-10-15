"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BUCKET_COLORS, BUCKET_LABELS, CUSTOMER_TYPES, npsBucket, type NpsBucket } from "@/lib/constants";
import type { ResponseRow } from "./actions";

const AXIS = { fontSize: 12, fill: "#516f90" };
const GRID = "#eaf0f6";
const ORANGE = "#ff5c35";

function ChartCard({
  title,
  subtitle,
  legend,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-white p-5 shadow-[0_1px_4px_rgba(33,51,67,0.06)]">
      <h3 className="font-semibold text-navy">{title}</h3>
      {subtitle && <p className="text-sm text-slate">{subtitle}</p>}
      {legend && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate">{legend}</div>}
      <div className="mt-3 h-56">{children}</div>
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function TooltipBox({ title, lines }: { title: string; lines: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-navy">{title}</p>
      {lines.map((l) => (
        <p key={l.label} className="flex items-center gap-1.5 text-slate">
          {l.color && <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: l.color }} />}
          {l.label}: <span className="font-medium text-navy">{l.value}</span>
        </p>
      ))}
    </div>
  );
}

const bucketLegend = (Object.keys(BUCKET_COLORS) as NpsBucket[]).map((b) => (
  <Swatch key={b} color={BUCKET_COLORS[b]} label={BUCKET_LABELS[b]} />
));

export function NpsDistributionChart({ rows }: { rows: ResponseRow[] }) {
  const data = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    return { score, count: rows.filter((r) => r.nps === score).length, bucket: npsBucket(score) };
  });
  return (
    <ChartCard title="NPS score distribution" subtitle="Number of responses per score" legend={bucketLegend}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap={4}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="score" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(33,51,67,0.04)" }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <TooltipBox
                  title={`Score ${payload[0].payload.score}`}
                  lines={[
                    {
                      label: BUCKET_LABELS[payload[0].payload.bucket as NpsBucket],
                      value: `${payload[0].payload.count} responses`,
                      color: BUCKET_COLORS[payload[0].payload.bucket as NpsBucket],
                    },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.score} fill={BUCKET_COLORS[d.bucket]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HappyChart({ rows }: { rows: ResponseRow[] }) {
  const yes = rows.filter((r) => r.happy).length;
  const no = rows.length - yes;
  const pct = rows.length ? Math.round((yes / rows.length) * 100) : 0;
  const data = [
    { name: "Happy", value: yes, color: BUCKET_COLORS.promoter },
    { name: "Not happy", value: no, color: BUCKET_COLORS.detractor },
  ];
  return (
    <ChartCard
      title="Happy vs. not happy"
      subtitle="Answers to “Are you happy with us?”"
      legend={data.map((d) => (
        <Swatch key={d.name} color={d.color} label={`${d.name} (${d.value})`} />
      ))}
    >
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.[0] ? (
                  <TooltipBox
                    title={String(payload[0].name)}
                    lines={[
                      {
                        label: "Responses",
                        value: `${payload[0].value} (${rows.length ? Math.round((Number(payload[0].value) / rows.length) * 100) : 0}%)`,
                        color: payload[0].payload.color,
                      },
                    ]}
                  />
                ) : null
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-navy">{pct}%</span>
          <span className="text-xs text-slate">happy</span>
        </div>
      </div>
    </ChartCard>
  );
}

export function ResponsesOverTimeChart({ rows }: { rows: ResponseRow[] }) {
  const DAYS = 60;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return d;
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    d.setHours(0, 0, 0, 0);
    const key = d.toDateString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const data = days.map((d) => ({
    label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: counts.get(d.toDateString()) ?? 0,
  }));

  return (
    <ChartCard title="Responses over time" subtitle="Daily responses, last 60 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORANGE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} interval={13} />
          <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ stroke: "#516f90", strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <TooltipBox
                  title={payload[0].payload.label}
                  lines={[{ label: "Responses", value: String(payload[0].value), color: ORANGE }]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={ORANGE}
            strokeWidth={2}
            fill="url(#areaFill)"
            activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function NpsByTypeChart({ rows }: { rows: ResponseRow[] }) {
  const data = CUSTOMER_TYPES.map((t) => {
    const group = rows.filter((r) => r.customer_type === t.value);
    const avg = group.length ? group.reduce((s, r) => s + r.nps, 0) / group.length : 0;
    return { label: t.label, avg: Math.round(avg * 10) / 10, n: group.length };
  }).filter((d) => d.n > 0);

  return (
    <ChartCard title="Average NPS by customer type" subtitle="Mean score (1–10)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 0 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={104} />
          <Tooltip
            cursor={{ fill: "rgba(33,51,67,0.04)" }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <TooltipBox
                  title={payload[0].payload.label}
                  lines={[
                    { label: "Average NPS", value: String(payload[0].payload.avg), color: ORANGE },
                    { label: "Responses", value: String(payload[0].payload.n) },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="avg" fill={ORANGE} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="avg" position="right" style={{ fontSize: 12, fill: "#213343", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
