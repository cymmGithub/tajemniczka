"use client";

import { useId, useOptimistic, useTransition } from "react";
import { setGroupPaused } from "@/app/g/[groupId]/ustawienia/actions";
import { Switch } from "./Switch";
import { T } from "@/lib/i18n/pl";

/**
 * Per-group SMS pause toggle with optimistic UI: the switch flips
 * immediately on click, then a server action persists.
 *
 * Click target is ONLY the switch button — the "Pauza wysyłki" label
 * is a plain span and not part of the hit area. The label is wired to
 * the button via `aria-labelledby` so screen readers still announce
 * what the toggle controls.
 */
export function PauseToggle({
  groupId,
  initialPaused,
}: {
  groupId: number;
  initialPaused: boolean;
}) {
  const labelId = useId();
  const [optimisticPaused, setOptimisticPaused] = useOptimistic(initialPaused);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const next = !optimisticPaused;
      setOptimisticPaused(next);
      await setGroupPaused(groupId, next);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span id={labelId} className="display text-lg">
        {T.settings.pauseLabel}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={optimisticPaused}
        aria-labelledby={labelId}
        className="cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marian"
      >
        <Switch on={optimisticPaused} />
      </button>
    </div>
  );
}
