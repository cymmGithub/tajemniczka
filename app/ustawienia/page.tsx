import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { setPaused, sendTestSms } from "./actions";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
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
    <main className="px-5 py-6 max-w-xl mx-auto space-y-7">
      <h2 className="display text-3xl heading-rule">{T.settings.title}</h2>

      <section>
        <div className="eyebrow mb-2">Wysyłka</div>
        <div className="card-paper p-4 space-y-3">
          <form action={togglePause}>
            <button
              type="submit"
              className="w-full text-left flex items-center justify-between gap-3"
            >
              <span className="display text-lg">{T.settings.pauseLabel}</span>
              <span
                className={
                  paused
                    ? "rubric text-sm"
                    : "font-[--font-display] uppercase tracking-[0.12em] text-sm text-[--color-ink-faded]"
                }
              >
                {paused ? "✓ włączona" : "wyłączona"}
              </span>
            </button>
          </form>
          <p className="text-sm text-[--color-ink-soft] italic">
            {T.settings.pauseHelp}
          </p>
        </div>
      </section>

      <section>
        <div className="eyebrow mb-2">Test</div>
        <form action={test}>
          <button
            type="submit"
            className="w-full p-3 text-lg bg-[--color-marian] text-[--color-paper] font-[--font-display] tracking-wide"
          >
            {T.settings.sendTest}
          </button>
        </form>
      </section>

      <section>
        <div className="eyebrow mb-2">Bezpieczeństwo</div>
        <div className="card-paper p-4 space-y-3">
          <h3 className="display text-lg">{T.settings.changePassword}</h3>
          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}
