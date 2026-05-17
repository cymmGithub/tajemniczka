import { notFound } from "next/navigation";
import { getGroup } from "@/lib/db/groups";
import { updateGroupName } from "./actions";
import { ActionButton } from "@/components/ActionButton";
import { PauseToggle } from "@/components/PauseToggle";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const id = Number(groupId);
  const group = await getGroup(id);
  if (!group) notFound();

  async function saveName(formData: FormData) {
    "use server";
    await updateGroupName(id, formData);
  }

  return (
    <main className="px-5 py-6 max-w-xl mx-auto space-y-7">
      <h2 className="display text-3xl heading-rule">{T.settings.title}</h2>

      <section>
        <div className="eyebrow mb-2">Wysyłka</div>
        <div className="card-paper p-4 space-y-3">
          <PauseToggle groupId={group.id} initialPaused={group.paused} />
          <p className="text-sm text-ink-soft italic">
            {T.settings.pauseHelp}
          </p>
        </div>
      </section>

      <section>
        <div className="eyebrow mb-2">Nazwa kółka</div>
        <form action={saveName} className="card-paper p-4 space-y-3">
          <label className="block">
            <span className="eyebrow">Pełna nazwa</span>
            <input
              name="name"
              defaultValue={group.name}
              required
              className="mt-2 block w-full bg-paper border border-paper-shadow focus:border-marian outline-none p-3 text-base"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Skrót (do nagłówka)</span>
            <input
              name="shortLabel"
              defaultValue={group.shortLabel}
              required
              className="mt-2 block w-full bg-paper border border-paper-shadow focus:border-marian outline-none p-3 text-base"
            />
          </label>
          <ActionButton className="btn-solid w-full p-3 text-base bg-ink text-paper">
            {T.members.save}
          </ActionButton>
        </form>
      </section>
    </main>
  );
}
