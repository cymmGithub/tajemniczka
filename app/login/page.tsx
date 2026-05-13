"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { T } from "@/lib/i18n/pl";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  return (
    <main className="px-5 py-6">
      <div className="card-paper max-w-sm mx-auto p-7">
        <div className="text-center mb-5">
          <div className="eyebrow">Wejście</div>
        </div>
        <form action={action} className="space-y-4">
          <label className="block">
            <span className="eyebrow">{T.login.passwordLabel}</span>
            <input
              type="password"
              name="password"
              autoFocus
              required
              className="mt-2 block w-full bg-[--color-paper] border border-[--color-paper-shadow] focus:border-[--color-marian] outline-none p-3 text-lg"
            />
          </label>
          {state?.error === "invalid" && (
            <p className="rubric text-sm">{T.login.invalid}</p>
          )}
          {state?.error === "rate" && (
            <p className="rubric text-sm">{T.login.rateLimited}</p>
          )}
          <button
            disabled={pending}
            className="w-full p-3 text-lg bg-[--color-ink] text-[--color-paper] font-[--font-display] tracking-wide disabled:opacity-50"
          >
            {T.login.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
