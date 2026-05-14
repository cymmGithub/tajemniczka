"use client";

import { useActionState } from "react";
import {
  changePassword,
  type ChangePasswordResult,
} from "@/app/ustawienia/actions";
import { ActionButton } from "@/components/ActionButton";
import { PasswordInput } from "@/components/PasswordInput";
import { T } from "@/lib/i18n/pl";

const initial: ChangePasswordResult = {};

const inputClass =
  "block w-full bg-paper border border-paper-shadow focus:border-marian outline-none p-3 text-base";

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
      <PasswordInput
        name="current"
        placeholder={T.settings.currentPassword}
        required
        className={inputClass}
      />
      <PasswordInput
        name="next"
        placeholder={T.settings.newPassword}
        required
        className={inputClass}
      />
      <PasswordInput
        name="confirm"
        placeholder={T.settings.confirmPassword}
        required
        className={inputClass}
      />
      {errMsg && <p className="rubric text-sm">{errMsg}</p>}
      {!state.error && state !== initial && (
        <p className="font-display uppercase tracking-[0.12em] text-sm text-marian">
          {T.settings.passwordChanged}
        </p>
      )}
      <ActionButton
        pending={pending}
        className="btn-solid w-full p-3 text-base bg-ink text-paper disabled:opacity-50"
      >
        {T.settings.changePassword}
      </ActionButton>
    </form>
  );
}
