import { db } from "@/lib/db/client";
import { members, sendRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { assignment } from "@/lib/rotation/algorithm";
import { startOfCycle } from "@/lib/rotation/cycle";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { PhoneToggle } from "@/components/PhoneToggle";
import { Tajemnica } from "@/components/Tajemnica";
import { ViewToggle } from "@/components/ViewToggle";
import { CycleSwitcher } from "@/components/CycleSwitcher";
import { CycleTable } from "@/components/CycleTable";
import { T, MONTHS_PL_TITLE } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function HomePage(props: {
  searchParams: Promise<{ y?: string; m?: string; view?: string }>;
}) {
  const sp = await props.searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();
  const month = sp.m ? Number(sp.m) : now.getMonth() + 1;
  const view = sp.view === "year" ? "year" : "month";

  const memberRows = await db.select().from(members);
  const bySlot = new Map(memberRows.map((m) => [m.slot, m]));

  if (view === "year") {
    const start = startOfCycle(year, month);
    return (
      <>
        <ViewToggle view="year" year={year} month={month} />
        <main className="py-6 max-w-screen-lg mx-auto">
          <CycleSwitcher start={start} />
          <CycleTable start={start} bySlot={bySlot} now={now} />
        </main>
      </>
    );
  }

  const lastRun = (
    await db.select().from(sendRuns).orderBy(desc(sendRuns.firedAt)).limit(1)
  )[0];

  return (
    <>
      <ViewToggle view="month" year={year} month={month} />
      <main className="px-5 py-6 max-w-xl mx-auto">
        <h2 className="display text-3xl text-center heading-rule mb-5 italic">
          {MONTHS_PL_TITLE[month - 1]}{" "}
          <span className="text-[--color-ink-faded]">{year}</span>
        </h2>

        <MonthSwitcher year={year} month={month} />

        <ol className="card-paper divide-y divide-[--color-paper-shadow]">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
            const tj = assignment(slot, year, month);
            const m = bySlot.get(slot);
            return (
              <li key={slot} className="flex items-baseline gap-4 px-4 py-3">
                <span className="font-[--font-display] text-base text-[--color-ink-faded] w-7 tabular-nums">
                  {slot}.
                </span>
                <span className="flex-1 text-lg leading-snug">
                  {m ? m.name : <span className="vacant">— {T.vacant} —</span>}
                </span>
                <Tajemnica roman={tj.roman} group={tj.group} />
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
          <div className="mt-5 flex items-center justify-between text-sm text-[--color-ink-faded]">
            <span className="italic">
              Ostatnia wysyłka:{" "}
              {new Date(lastRun.firedAt).toLocaleDateString("pl-PL")}
            </span>
            <span
              className={
                lastRun.status === "success"
                  ? "font-[--font-display] uppercase tracking-[0.12em] text-[--color-marian]"
                  : "rubric"
              }
            >
              {T.history.statuses[
                lastRun.status as keyof typeof T.history.statuses
              ] ?? lastRun.status}
            </span>
          </div>
        )}
      </main>
    </>
  );
}
