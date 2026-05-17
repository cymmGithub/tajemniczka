import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { members, sendRuns } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { assignment } from "@/lib/rotation/algorithm";
import { startOfCycle } from "@/lib/rotation/cycle";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { PhoneToggle } from "@/components/PhoneToggle";
import { Tajemnica } from "@/components/Tajemnica";
import { ViewToggle } from "@/components/ViewToggle";
import { CycleSwitcher } from "@/components/CycleSwitcher";
import { CycleTable } from "@/components/CycleTable";
import { getGroup } from "@/lib/db/groups";
import { T, MONTHS_PL_TITLE } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function GroupBoardPage(props: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ y?: string; m?: string; view?: string }>;
}) {
  const { groupId } = await props.params;
  const id = Number(groupId);
  const group = await getGroup(id);
  if (!group) notFound();

  const anchor = { year: group.anchorYear, month: group.anchorMonth };
  const basePath = `/g/${group.id}/`;

  const sp = await props.searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();
  const month = sp.m ? Number(sp.m) : now.getMonth() + 1;
  const view = sp.view === "year" ? "year" : "month";

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.groupId, group.id));
  const bySlot = new Map(memberRows.map((m) => [m.slot, m]));

  if (view === "year") {
    const start = startOfCycle(year, month, anchor);
    return (
      <>
        <ViewToggle view="year" year={year} month={month} basePath={basePath} />
        <main className="py-6 max-w-screen-lg mx-auto">
          <CycleSwitcher start={start} anchor={anchor} basePath={basePath} />
          <CycleTable start={start} bySlot={bySlot} now={now} anchor={anchor} />
        </main>
      </>
    );
  }

  const lastRun = (
    await db
      .select()
      .from(sendRuns)
      .where(eq(sendRuns.groupId, group.id))
      .orderBy(desc(sendRuns.firedAt))
      .limit(1)
  )[0];

  return (
    <>
      <ViewToggle view="month" year={year} month={month} basePath={basePath} />
      <main className="px-5 py-6 max-w-xl mx-auto">
        <h2 className="display text-3xl text-center heading-rule mb-5 italic">
          {MONTHS_PL_TITLE[month - 1]}{" "}
          <span className="text-ink-faded">{year}</span>
        </h2>

        <MonthSwitcher year={year} month={month} basePath={basePath} />

        <ol className="card-paper divide-y divide-paper-shadow">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
            const tj = assignment(slot, year, month, anchor);
            const m = bySlot.get(slot);
            return (
              <li key={slot} className="flex items-baseline gap-4 px-4 py-3">
                <span className="font-display text-base text-ink-faded w-7 tabular-nums">
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
          <div className="mt-5 flex items-center justify-between text-sm text-ink-faded">
            <span className="italic">
              Ostatnia wysyłka:{" "}
              {new Date(lastRun.firedAt).toLocaleDateString("pl-PL")}
            </span>
            <span
              className={
                lastRun.status === "success"
                  ? "font-display uppercase tracking-[0.12em] text-marian"
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
