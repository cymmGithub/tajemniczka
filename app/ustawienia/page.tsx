import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { setPaused, sendTestSms, changePassword } from "./actions";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const row = (
    await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
  )[0];
  const paused = row?.paused ?? false;

  async function togglePause() {
    "use server";
    await setPaused(!paused);
  }
  async function test() {
    "use server";
    await sendTestSms();
  }

  return (
    <main className="p-4 max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">{T.settings.title}</h1>

      <section className="space-y-2">
        <form action={togglePause}>
          <button
            className={`w-full rounded p-3 text-white ${paused ? "bg-amber-600" : "bg-slate-900"}`}
          >
            {T.settings.pauseLabel} {paused ? "✓ włączona" : "wyłączona"}
          </button>
        </form>
        <p className="text-sm text-slate-600">{T.settings.pauseHelp}</p>
      </section>

      <section>
        <form action={test}>
          <button className="w-full rounded bg-blue-700 text-white p-3">
            {T.settings.sendTest}
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{T.settings.changePassword}</h2>
        <form action={changePassword} className="space-y-3">
          <input
            name="current"
            type="password"
            placeholder={T.settings.currentPassword}
            className="block w-full rounded border border-slate-300 p-3"
            required
          />
          <input
            name="next"
            type="password"
            placeholder={T.settings.newPassword}
            className="block w-full rounded border border-slate-300 p-3"
            required
          />
          <input
            name="confirm"
            type="password"
            placeholder={T.settings.confirmPassword}
            className="block w-full rounded border border-slate-300 p-3"
            required
          />
          <button className="w-full rounded bg-slate-900 text-white p-3">
            {T.settings.changePassword}
          </button>
        </form>
      </section>
    </main>
  );
}
