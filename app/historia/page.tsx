import Link from "next/link";
import { db } from "@/lib/db/client";
import { sendRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { T, MONTHS_PL_TITLE } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const runs = await db
    .select()
    .from(sendRuns)
    .orderBy(desc(sendRuns.firedAt))
    .limit(60);

  return (
    <main className="px-5 py-6 max-w-xl mx-auto">
      <h2 className="display text-3xl heading-rule mb-5">{T.history.title}</h2>

      {runs.length === 0 ? (
        <p className="italic text-[--color-ink-faded]">{T.history.noRuns}</p>
      ) : (
        <ul className="card-paper divide-y divide-[--color-paper-shadow]">
          {runs.map((r) => {
            const isFail = r.status !== "success";
            return (
              <li
                key={r.id}
                className="flex items-baseline gap-4 px-4 py-4"
              >
                <div className="flex-1">
                  <div className="display text-xl italic">
                    {MONTHS_PL_TITLE[r.targetMonth - 1]}{" "}
                    <span className="text-[--color-ink-faded] not-italic">
                      {r.targetYear}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    <span
                      className={
                        isFail
                          ? "rubric"
                          : "font-[--font-display] uppercase tracking-[0.12em] text-[--color-marian]"
                      }
                    >
                      {T.history.statuses[
                        r.status as keyof typeof T.history.statuses
                      ] ?? r.status}
                    </span>
                    <span className="text-[--color-ink-faded]">
                      {" · "}
                      {T.history.sentCount(r.totalSentOk, r.totalIntended)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/historia/${r.id}`}
                  className="text-sm underline underline-offset-4"
                >
                  {T.history.details}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
