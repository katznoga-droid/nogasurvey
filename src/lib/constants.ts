export const CUSTOMER_TYPES = [
  { value: "small_business", label: "Small Business" },
  { value: "mid_market", label: "Mid-Market" },
  { value: "enterprise", label: "Enterprise" },
  { value: "agency_partner", label: "Agency / Partner" },
] as const;

export type CustomerType = (typeof CUSTOMER_TYPES)[number]["value"];

export const CUSTOMER_TYPE_VALUES = CUSTOMER_TYPES.map((t) => t.value) as [
  CustomerType,
  ...CustomerType[],
];

export function customerTypeLabel(value: string) {
  return CUSTOMER_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** NPS buckets adapted to the 1–10 scale. */
export type NpsBucket = "detractor" | "passive" | "promoter";

export function npsBucket(score: number): NpsBucket {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export const BUCKET_COLORS: Record<NpsBucket, string> = {
  detractor: "#e0434a",
  passive: "#d9901a",
  promoter: "#00957f",
};

export const BUCKET_LABELS: Record<NpsBucket, string> = {
  detractor: "Detractor (1–6)",
  passive: "Passive (7–8)",
  promoter: "Promoter (9–10)",
};

export const REALTIME_CHANNEL = "survey-responses";
export const REALTIME_EVENT = "new_response";

export const SESSION_COOKIE = "nogasurvey_admin";
