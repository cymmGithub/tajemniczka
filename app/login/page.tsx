"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { T } from "@/lib/i18n/pl";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">{T.login.title}</h1>
        <label className="block">
          <span className="text-sm text-slate-700">{T.login.passwordLabel}</span>
          <input
            type="password"
            name="password"
            autoFocus
            className="mt-1 block w-full rounded border border-slate-300 p-3 text-base"
            required
          />
        </label>
        {state?.error === "invalid" && (
          <p className="text-sm text-red-600">{T.login.invalid}</p>
        )}
        {state?.error === "rate" && (
          <p className="text-sm text-red-600">{T.login.rateLimited}</p>
        )}
        <button
          disabled={pending}
          className="w-full rounded bg-slate-900 text-white p-3 text-base disabled:opacity-50"
        >
          {T.login.submit}
        </button>
      </form>
    </main>
  );
}
