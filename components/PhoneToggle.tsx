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
        className="text-sm text-blue-700 underline"
      >
        {show ? T.hidePhones : T.showPhones}
      </button>
      {show && (
        <ul className="mt-2 text-sm text-slate-600 space-y-1">
          {slots.map((s) => (
            <li key={s.slot}>
              Slot {s.slot}: {s.name ?? "—"}{" "}
              {s.phone ? (
                <a href={`tel:${s.phone}`} className="text-blue-700">
                  {s.phone}
                </a>
              ) : (
                "—"
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
