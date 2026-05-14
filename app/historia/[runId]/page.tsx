import { db } from "@/lib/db/client";
import { sendRuns, sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { retrySend } from "../actions";
import { T, MONTHS_PL_TITLE } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

function resultClass(status: string): string {
  if (status === "delivered") {
    return "font-display uppercase tracking-[0.12em] text-xs text-marian";
  }
  if (status === "failed" || status === "undelivered") {
    return "rubric text-xs";
  }
  return "font-display uppercase tracking-[0.12em] text-xs text-ink-faded";
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const id = Number(runId);
  const run = (
    await db.select().from(sendRuns).where(eq(sendRuns.id, id)).limit(1)
  )[0];
  if (!run) {
    return (
      <main className="px-5 py-6 max-w-xl mx-auto">
        <p className="italic text-ink-faded">Brak takiego biegu.</p>
      </main>
    );
  }
  const results = await db
    .select()
    .from(sendResults)
    .where(eq(sendResults.runId, id));

  const runIsFail = run.status !== "success";

  return (
    <main className="px-5 py-6 max-w-xl mx-auto space-y-4">
      <div>
        <h2 className="display text-3xl heading-rule italic">
          {MONTHS_PL_TITLE[run.targetMonth - 1]}{" "}
          <span className="text-ink-faded not-italic">
            {run.targetYear}
          </span>
        </h2>
        <p className="mt-2 text-sm">
          <span
            className={
              runIsFail
                ? "rubric"
                : "font-display uppercase tracking-[0.12em] text-marian"
            }
          >
            {T.history.statuses[
              run.status as keyof typeof T.history.statuses
            ] ?? run.status}
          </span>
        </p>
      </div>

      <ul className="card-paper divide-y divide-paper-shadow">
        {results.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-base">
                <span className="font-display text-ink-faded tabular-nums">
                  {r.slot}.
                </span>{" "}
                {r.memberName}
              </div>
              <div className="text-xs text-ink-faded tabular-nums">
                {r.phoneE164}
              </div>
              <div className="text-xs text-ink-soft italic break-words mt-1">
                {r.messageBody}
              </div>
              {(r.errorMessage ?? r.errorCode) && (
                <div className="text-xs rubric mt-1">
                  {r.errorMessage ?? r.errorCode}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className={resultClass(r.status)}>{r.status}</span>
              {(r.status === "failed" || r.status === "undelivered") && (
                <form action={retrySend.bind(null, r.id)}>
                  <button className="block text-xs rubric underline underline-offset-4 mt-2 btn-link">
                    {T.history.retry}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
