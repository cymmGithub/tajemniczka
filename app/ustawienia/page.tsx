import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { setPaused } from "./actions";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { TestSmsButton } from "@/components/TestSmsButton";
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
                    : "font-display uppercase tracking-[0.12em] text-sm text-ink-faded"
                }
              >
                {paused ? "✓ włączona" : "wyłączona"}
              </span>
            </button>
          </form>
          <p className="text-sm text-ink-soft italic">
            {T.settings.pauseHelp}
          </p>
        </div>
      </section>

      <section>
        <div className="eyebrow mb-2">Test</div>
        <TestSmsButton />
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
