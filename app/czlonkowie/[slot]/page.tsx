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
  const row = (await db.select().from(members).where(eq(members.slot, slot)).limit(1))[0];

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
    <main className="p-4 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Slot {slot}</h1>
      <form action={save} className="space-y-4">
        <label className="block">
          <span className="text-sm">{T.members.name}</span>
          <input
            name="name"
            defaultValue={row?.name ?? ""}
            className="mt-1 block w-full rounded border border-slate-300 p-3"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm">{T.members.phone}</span>
          <input
            name="phone"
            defaultValue={row?.phoneE164 ?? ""}
            inputMode="tel"
            placeholder="+48 ..."
            className="mt-1 block w-full rounded border border-slate-300 p-3"
            required
          />
        </label>
        <button className="rounded bg-slate-900 text-white p-3 w-full">
          {T.members.save}
        </button>
      </form>
      {row && (
        <form action={remove}>
          <button className="text-red-600 underline text-sm">{T.members.remove}</button>
        </form>
      )}
    </main>
  );
}
