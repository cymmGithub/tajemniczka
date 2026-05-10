import { db } from "@/lib/db/client";
import { members, sendRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { assignment } from "@/lib/rotation/algorithm";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { PhoneToggle } from "@/components/PhoneToggle";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function HomePage(props: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const sp = await props.searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();
  const month = sp.m ? Number(sp.m) : now.getMonth() + 1;

  const memberRows = await db.select().from(members);
  const bySlot = new Map(memberRows.map((m) => [m.slot, m]));

  const lastRun = (
    await db.select().from(sendRuns).orderBy(desc(sendRuns.firedAt)).limit(1)
  )[0];

  return (
    <main className="p-4 max-w-xl mx-auto">
      <MonthSwitcher year={year} month={month} />
      <ol className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const tj = assignment(slot, year, month);
          const m = bySlot.get(slot);
          return (
            <li key={slot} className="flex items-center gap-3 p-3 text-base">
              <span className="font-mono w-8 text-slate-500">{slot}</span>
              <span className="flex-1">
                {m ? m.name : <em className="text-slate-400">{T.vacant}</em>}
              </span>
              <span className="font-semibold tabular-nums">{tj.short}</span>
            </li>
          );
        })}
      </ol>

      <PhoneToggle
        slots={Array.from({ length: 20 }, (_, i) => i + 1).map((s) => ({
          slot: s,
          name: bySlot.get(s)?.name ?? null,
          phone: bySlot.get(s)?.phoneE164 ?? null,
        }))}
      />

      {lastRun && (
        <p className="text-sm text-slate-600 mt-4">
          Ostatnia wysyłka:{" "}
          <span
            className={
              lastRun.status === "success" ? "text-green-700" : "text-red-700"
            }
          >
            {T.history.statuses[lastRun.status as keyof typeof T.history.statuses] ??
              lastRun.status}
          </span>{" "}
          ({new Date(lastRun.firedAt).toLocaleDateString("pl-PL")})
        </p>
      )}
    </main>
  );
}
