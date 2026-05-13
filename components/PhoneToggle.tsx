"use client";
import { useState } from "react";
import { T } from "@/lib/i18n/pl";

export function PhoneToggle({
  slots,
}: {
  slots: { slot: number; name: string | null; phone: string | null }[];
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setShow((v) => !v)}
        className="text-sm rubric underline underline-offset-4"
      >
        {show ? T.hidePhones : T.showPhones}
      </button>
      {show && (
        <ul className="mt-3 card-paper divide-y divide-[--color-paper-shadow] text-sm">
          {slots.map((s) => (
            <li
              key={s.slot}
              className="flex items-baseline gap-3 px-4 py-2"
            >
              <span className="font-[--font-display] text-[--color-ink-faded] w-7 tabular-nums">
                {s.slot}.
              </span>
              <span className="flex-1">{s.name ?? <span className="vacant">—</span>}</span>
              {s.phone ? (
                <a href={`tel:${s.phone}`} className="rubric tabular-nums">
                  {s.phone}
                </a>
              ) : (
                <span className="vacant">—</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
