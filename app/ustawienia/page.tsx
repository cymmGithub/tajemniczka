import Link from "next/link";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { TestSmsButton } from "@/components/TestSmsButton";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="px-5 py-6 max-w-xl mx-auto space-y-7">
      <div className="flex items-baseline justify-between">
        <h2 className="display text-3xl heading-rule">{T.settings.title}</h2>
        <Link
          href="/"
          className="eyebrow text-ink-faded hover:text-ink underline underline-offset-4"
        >
          ‹ Wybór kółka
        </Link>
      </div>

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
