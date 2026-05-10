import { db } from "@/lib/db/client";
import { sendRuns, sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { retrySend } from "../actions";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

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
  if (!run) return <main className="p-4">Brak takiego biegu.</main>;
  const results = await db
    .select()
    .from(sendResults)
    .where(eq(sendResults.runId, id));

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">
        {T.monthLabel(run.targetYear, run.targetMonth)}
      </h1>
      <p className="text-sm text-slate-600">
        {T.history.statuses[run.status as keyof typeof T.history.statuses] ??
          run.status}
      </p>
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {results.map((r) => (
          <li
            key={r.id}
            className="p-3 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold">
                Slot {r.slot} — {r.memberName}
              </div>
              <div className="text-xs text-slate-500">{r.phoneE164}</div>
              <div className="text-xs text-slate-500 break-words">
                {r.messageBody}
              </div>
              {r.errorMessage && (
                <div className="text-xs text-red-700">{r.errorMessage}</div>
              )}
            </div>
            <div className="text-right shrink-0">
              <span
                className={
                  r.status === "delivered"
                    ? "text-green-700"
                    : r.status === "failed" || r.status === "undelivered"
                      ? "text-red-700"
                      : "text-slate-600"
                }
              >
                {r.status}
              </span>
              {(r.status === "failed" || r.status === "undelivered") && (
                <form action={retrySend.bind(null, r.id)}>
                  <button className="block text-xs text-blue-700 underline mt-1">
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
