"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

export function ActionButton({
  pending: pendingProp,
  children,
  className = "",
  loadingLabel,
  ...rest
}: {
  pending?: boolean;
  loadingLabel?: string;
} & Omit<ComponentProps<"button">, "children"> & { children: ReactNode }) {
  const formStatus = useFormStatus();
  const pending = pendingProp ?? formStatus.pending;
  return (
    <button
      type="submit"
      disabled={pending || rest.disabled}
      className={`relative ${className}`}
      aria-busy={pending}
      {...rest}
    >
      <span className={`contents ${pending ? "invisible" : ""}`}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="btn-spinner" aria-label={loadingLabel ?? "Ładowanie"} />
        </span>
      )}
    </button>
  );
}
