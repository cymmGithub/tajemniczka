import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { upsertMember, deleteMember } from "../actions";
import { T } from "@/lib/i18n/pl";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ slot: string }>;
}) {
  const { slot: slotStr } = await params;
  const slot = Number(slotStr);
  const row = (
    await db.select().from(members).where(eq(members.slot, slot)).limit(1)
  )[0];

  async function save(formData: FormData) {
    "use server";
    const result = await upsertMember(slot, formData);
    if (!result) redirect("/czlonkowie");
  }

  async function remove() {
    "use server";
    await deleteMember(slot);
    redirect("/czlonkowie");
  }

  return (
    <main className="px-5 py-6 max-w-xl mx-auto space-y-6">
      <div>
        <div className="eyebrow">Slot</div>
        <h2 className="display text-3xl heading-rule">
          <span className="font-[--font-display] tabular-nums">{slot}</span>
          {row?.name && (
            <span className="text-[--color-ink-faded] italic text-2xl">
              {" "}
              · {row.name}
            </span>
          )}
        </h2>
      </div>

      <form action={save} className="card-paper p-5 space-y-4">
        <label className="block">
          <span className="eyebrow">{T.members.name}</span>
          <input
            name="name"
            defaultValue={row?.name ?? ""}
            required
            className="mt-2 block w-full bg-[--color-paper] border border-[--color-paper-shadow] focus:border-[--color-marian] outline-none p-3 text-lg"
          />
        </label>
        <label className="block">
          <span className="eyebrow">{T.members.phone}</span>
          <input
            name="phone"
            defaultValue={row?.phoneE164 ?? ""}
            inputMode="tel"
            placeholder="+48 ..."
            required
            className="mt-2 block w-full bg-[--color-paper] border border-[--color-paper-shadow] focus:border-[--color-marian] outline-none p-3 text-lg tabular-nums"
          />
        </label>
        <button className="w-full p-3 text-lg bg-[--color-ink] text-[--color-paper] font-[--font-display] tracking-wide">
          {T.members.save}
        </button>
      </form>

      {row && (
        <form action={remove} className="text-center">
          <button className="rubric text-sm underline underline-offset-4">
            {T.members.remove}
          </button>
        </form>
      )}
    </main>
  );
}
