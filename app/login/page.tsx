"use client";
import { useActionState } from "react";
import Image from "next/image";
import { loginAction, type LoginState } from "./actions";
import { ActionButton } from "@/components/ActionButton";
import { PasswordInput } from "@/components/PasswordInput";
import { T } from "@/lib/i18n/pl";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  return (
    <main className="px-5 py-10 sm:py-14">
      <div className="max-w-sm mx-auto">

        {/* Title block — sets the devotional title-page tone */}
        <header className="text-center">
          <h1 className="display text-5xl text-ink leading-none tracking-[0.03em]">
            Tajemniczka
          </h1>
          <div className="fleuron mt-4 mx-auto max-w-[14rem] text-sm">
            <span>✦</span>
          </div>
        </header>

        {/* Parish photo — uncaptioned, lets the image speak */}
        <div className="text-center mt-10">
          <div className="gilt-frame mx-auto aspect-square w-full max-w-[18rem]">
            <Image
              src="/parafia-dys.jpg"
              alt="Kościół parafialny w Dysie"
              fill
              priority
              sizes="(max-width: 480px) 80vw, 18rem"
              className="object-cover"
            />
          </div>
        </div>

        {/* Login form — sits directly on the parchment, no card */}
        <form action={action} className="mt-14 space-y-7">
          <label className="block">
            <span className="sr-only">{T.login.passwordLabel}</span>
            <PasswordInput
              name="password"
              autoFocus
              required
              placeholder={T.login.passwordLabel}
              aria-label={T.login.passwordLabel}
              className="input-rule pl-12"
            />
          </label>

          {state?.error === "invalid" && (
            <p className="rubric text-sm italic text-center">{T.login.invalid}</p>
          )}
          {state?.error === "rate" && (
            <p className="rubric text-sm italic text-center">{T.login.rateLimited}</p>
          )}

          <ActionButton
            pending={pending}
            className="btn-outline-gilt w-full py-3 text-lg"
          >
            {T.login.submit}
          </ActionButton>
        </form>

      </div>
    </main>
  );
}
