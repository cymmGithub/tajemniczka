"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordResult } from "@/app/ustawienia/actions";
import { T } from "@/lib/i18n/pl";

const initial: ChangePasswordResult = {};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordResult, FormData>(
    async (_prev, formData) => changePassword(formData),
    initial,
  );

  const errMsg =
    state.error === "passwordsDoNotMatch"
      ? T.settings.passwordsDoNotMatch
      : state.error === "invalid"
        ? T.login.invalid
        : null;

  return (
    <form action={action} className="space-y-3">
      <input
        name="current"
        type="password"
        placeholder={T.settings.currentPassword}
        className="block w-full rounded border border-slate-300 p-3"
        required
      />
      <input
        name="next"
        type="password"
        placeholder={T.settings.newPassword}
        className="block w-full rounded border border-slate-300 p-3"
        required
      />
      <input
        name="confirm"
        type="password"
        placeholder={T.settings.confirmPassword}
        className="block w-full rounded border border-slate-300 p-3"
        required
      />
      {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}
      {!state.error && state !== initial && (
        <p className="text-sm text-green-700">{T.settings.passwordChanged}</p>
      )}
      <button
        disabled={pending}
        className="w-full rounded bg-slate-900 text-white p-3 disabled:opacity-50"
      >
        {T.settings.changePassword}
      </button>
    </form>
  );
}
