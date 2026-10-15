"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const inputCls =
  "mt-2 w-full rounded-md border border-line px-4 py-3 text-navy focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="block font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          defaultValue={state.username}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="password" className="block font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputCls}
        />
      </div>
      {state.error && (
        <p className="rounded-md bg-detractor/10 px-4 py-3 text-sm text-detractor">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-6 py-3 font-medium text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Submit"}
      </button>
    </form>
  );
}
