"use client";

import { useActionState } from "react";
import { CUSTOMER_TYPES } from "@/lib/constants";
import { submitSurvey, type SurveyState } from "./actions";

const labelCls = "block text-base font-medium text-navy";
const errorCls = "mt-1 text-sm text-detractor";

export function SurveyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<SurveyState, FormData>(
    submitSurvey.bind(null, token),
    {},
  );
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="mt-8 space-y-8">
      <fieldset>
        <legend className={labelCls}>
          Overall NPS <span className="text-brand">*</span>
        </legend>
        <p className="text-sm text-slate">How likely are you to recommend us to a friend? (1–10)</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="nps"
                value={n}
                defaultChecked={state.values?.nps === String(n)}
                className="peer sr-only"
                required
              />
              <span className="flex h-11 items-center justify-center rounded-md border border-line bg-white font-medium text-navy transition hover:border-brand peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                {n}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
        {err.nps && <p className={errorCls}>{err.nps}</p>}
      </fieldset>

      <fieldset>
        <legend className={labelCls}>
          Are you happy with us? <span className="text-brand">*</span>
        </legend>
        <div className="mt-3 flex gap-3">
          {[
            { v: "yes", l: "Yes" },
            { v: "no", l: "No" },
          ].map(({ v, l }) => (
            <label
              key={v}
              className="flex flex-1 cursor-pointer items-center gap-3 rounded-md border border-line px-4 py-3 transition hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
            >
              <input
                type="radio"
                name="happy"
                value={v}
                defaultChecked={state.values?.happy === v}
                className="h-4 w-4 accent-brand"
                required
              />
              <span className="font-medium">{l}</span>
            </label>
          ))}
        </div>
        {err.happy && <p className={errorCls}>{err.happy}</p>}
      </fieldset>

      <div>
        <label htmlFor="feedback" className={labelCls}>
          General feedback
        </label>
        <textarea
          id="feedback"
          name="feedback"
          rows={5}
          maxLength={2000}
          defaultValue={state.values?.feedback}
          placeholder="Tell us what's working and what we could do better…"
          className="mt-3 w-full rounded-md border border-line px-4 py-3 text-navy placeholder:text-slate/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        {err.feedback && <p className={errorCls}>{err.feedback}</p>}
      </div>

      <div>
        <label htmlFor="customer_type" className={labelCls}>
          Type of customer <span className="text-brand">*</span>
        </label>
        <select
          id="customer_type"
          name="customer_type"
          required
          defaultValue={state.values?.customer_type ?? ""}
          className="mt-3 w-full rounded-md border border-line bg-white px-4 py-3 text-navy focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="" disabled>
            Select one…
          </option>
          {CUSTOMER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {err.customer_type && <p className={errorCls}>{err.customer_type}</p>}
      </div>

      {state.error && (
        <p className="rounded-md bg-detractor/10 px-4 py-3 text-sm text-detractor">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-6 py-3 text-lg font-medium text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}
