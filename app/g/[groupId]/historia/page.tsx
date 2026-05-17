import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { sendRuns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getGroup } from "@/lib/db/groups";
import { T, MONTHS_PL_TITLE } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const id = Number(groupId);
  const group = await getGroup(id);
  if (!group) notFound();

  const runs = await db
    .select()
    .from(sendRuns)
    .where(eq(sendRuns.groupId, group.id))
    .orderBy(desc(sendRuns.firedAt))
    .limit(60);

  return (
    <main className="px-5 py-6 max-w-xl mx-auto">
      <h2 className="display text-3xl heading-rule mb-5">{T.history.title}</h2>

      {runs.length === 0 ? (
        <p className="italic text-ink-faded">{T.history.noRuns}</p>
      ) : (
        <ul className="card-paper divide-y divide-paper-shadow">
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
                    <span className="text-ink-faded not-italic">
                      {r.targetYear}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    <span
                      className={
                        isFail
                          ? "rubric"
                          : "font-display uppercase tracking-[0.12em] text-marian"
                      }
                    >
                      {T.history.statuses[
                        r.status as keyof typeof T.history.statuses
                      ] ?? r.status}
                    </span>
                    <span className="text-ink-faded">
                      {" · "}
                      {T.history.sentCount(r.totalSentOk, r.totalIntended)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/g/${group.id}/historia/${r.id}`}
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
