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
    <main className="px-5 py-8">
      <div className="max-w-sm mx-auto space-y-7">
        <figure className="text-center">
          <div className="gilt-frame mx-auto aspect-square w-full max-w-[18rem]">
            <Image
              src="/parafia-dys.jpg"
              alt="Kościół parafialny w Dysie"
              fill
              priority
              sizes="(max-width: 480px) 90vw, 18rem"
              className="object-cover"
            />
          </div>
          <figcaption className="eyebrow mt-5 text-ink-faded">
            Parafia w Dysie
          </figcaption>
        </figure>

        <div className="card-paper p-7">
          <div className="text-center mb-5">
            <div className="eyebrow">Wejście</div>
          </div>
          <form action={action} className="space-y-4">
            <label className="block">
              <span className="eyebrow">{T.login.passwordLabel}</span>
              <PasswordInput
                name="password"
                autoFocus
                required
                className="mt-2 block w-full bg-paper border border-paper-shadow focus:border-marian outline-none p-3 text-lg"
              />
            </label>
            {state?.error === "invalid" && (
              <p className="rubric text-sm">{T.login.invalid}</p>
            )}
            {state?.error === "rate" && (
              <p className="rubric text-sm">{T.login.rateLimited}</p>
            )}
            <ActionButton
              pending={pending}
              className="btn-solid w-full p-3 text-lg bg-ink text-paper disabled:opacity-50"
            >
              {T.login.submit}
            </ActionButton>
          </form>
        </div>
      </div>
    </main>
  );
}
