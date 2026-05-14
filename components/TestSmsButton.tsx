"use client";

import { useActionState } from "react";
import { sendTestSms, type TestSmsResult } from "@/app/ustawienia/actions";
import { T } from "@/lib/i18n/pl";

export function TestSmsButton() {
  const [state, action, pending] = useActionState<TestSmsResult | null, FormData>(
    sendTestSms,
    null,
  );
  return (
    <form action={action} className="space-y-2">
      <button
        type="submit"
        disabled={pending}
        className="btn-solid w-full p-3 text-lg bg-marian text-paper disabled:opacity-50"
      >
        {pending ? "Wysyłanie…" : T.settings.sendTest}
      </button>
      {state?.ok && state.testMode && (
        <p className="text-sm text-ink-soft italic">
          {T.settings.testSentTestMode}
        </p>
      )}
      {state?.ok && !state.testMode && (
        <p className="text-sm text-marian font-display">
          {T.settings.testSent}
        </p>
      )}
      {state && !state.ok && (
        <p className="rubric text-sm">
          {T.settings.testFailed} {state.error}
        </p>
      )}
    </form>
  );
}
