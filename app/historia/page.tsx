import Link from "next/link";
import { db } from "@/lib/db/client";
import { sendRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const runs = await db
    .select()
    .from(sendRuns)
    .orderBy(desc(sendRuns.firedAt))
    .limit(60);

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{T.history.title}</h1>
      {runs.length === 0 && (
        <p className="text-slate-500">{T.history.noRuns}</p>
      )}
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {runs.map((r) => (
          <li
            key={r.id}
            className="p-3 flex items-center justify-between gap-3"
          >
            <div>
              <div className="font-semibold">
                {T.monthLabel(r.targetYear, r.targetMonth)}
              </div>
              <div className="text-sm text-slate-600">
                {T.history.statuses[r.status as keyof typeof T.history.statuses] ??
                  r.status}
                {" · "}
                {T.history.sentCount(r.totalSentOk, r.totalIntended)}
              </div>
            </div>
            <Link
              href={`/historia/${r.id}`}
              className="text-blue-700 underline text-sm"
            >
              {T.history.details}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
