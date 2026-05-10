import Link from "next/link";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const rows = await db.select().from(members);
  const bySlot = new Map(rows.map((r) => [r.slot, r]));

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{T.members.title}</h1>
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const m = bySlot.get(slot);
          return (
            <li key={slot} className="flex items-center justify-between gap-3 p-3">
              <span className="font-mono w-8 text-slate-500">{slot}</span>
              <span className="flex-1">
                {m?.name ?? <em className="text-slate-400">{T.members.add}</em>}
              </span>
              <Link href={`/czlonkowie/${slot}`} className="text-blue-700 underline text-sm">
                {m ? "Edytuj" : T.members.add}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
