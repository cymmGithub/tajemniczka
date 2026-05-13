"use client";

import { useActionState } from "react";
import {
  changePassword,
  type ChangePasswordResult,
} from "@/app/ustawienia/actions";
import { T } from "@/lib/i18n/pl";

const initial: ChangePasswordResult = {};

const inputClass =
  "block w-full bg-[--color-paper] border border-[--color-paper-shadow] focus:border-[--color-marian] outline-none p-3 text-base";

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
        required
        className={inputClass}
      />
      <input
        name="next"
        type="password"
        placeholder={T.settings.newPassword}
        required
        className={inputClass}
      />
      <input
        name="confirm"
        type="password"
        placeholder={T.settings.confirmPassword}
        required
        className={inputClass}
      />
      {errMsg && <p className="rubric text-sm">{errMsg}</p>}
      {!state.error && state !== initial && (
        <p className="font-[--font-display] uppercase tracking-[0.12em] text-sm text-[--color-marian]">
          {T.settings.passwordChanged}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full p-3 text-base bg-[--color-ink] text-[--color-paper] font-[--font-display] tracking-wide disabled:opacity-50"
      >
        {T.settings.changePassword}
      </button>
    </form>
  );
}
