import Link from "next/link";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const rows = await db.select().from(members);
  const bySlot = new Map(rows.map((r) => [r.slot, r]));

  return (
    <main className="px-5 py-6 max-w-xl mx-auto">
      <h2 className="display text-3xl heading-rule mb-5">{T.members.title}</h2>
      <ul className="card-paper divide-y divide-paper-shadow">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const m = bySlot.get(slot);
          return (
            <li key={slot} className="flex items-baseline gap-4 px-4 py-3">
              <span className="font-display text-base text-ink-faded w-7 tabular-nums">
                {slot}.
              </span>
              <span className="flex-1 text-lg">
                {m?.name ?? (
                  <span className="vacant">— miejsce wolne —</span>
                )}
              </span>
              <Link
                href={`/czlonkowie/${slot}`}
                className="rubric text-sm underline underline-offset-4 btn-link"
              >
                {m ? "Edytuj" : T.members.add}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
