import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db/client";
import { groups } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PickerPage() {
  const rows = await db.select().from(groups).orderBy(asc(groups.id));

  return (
    <main className="px-5 py-8 max-w-3xl mx-auto">
      <header className="pt-4 pb-2 text-center">
        <h1 className="display text-4xl text-ink leading-none">Tajemniczka</h1>
        <div className="fleuron mt-3 mx-auto max-w-[16rem] text-sm">
          <span>✦</span>
        </div>
        <p className="eyebrow mt-5 text-ink-faded">Wybierz kółko</p>
      </header>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7">
        {rows.map((g) => (
          <Link
            key={g.id}
            href={`/g/${g.id}/`}
            className="card-paper p-6 pt-7 flex flex-col items-center text-center hover:bg-paper-deep/40 transition-colors group"
          >
            <div className="portrait-frame w-44 h-44 sm:w-52 sm:h-52">
              <Image
                src={g.imagePath}
                alt={g.shortLabel}
                fill
                priority
                sizes="(max-width: 640px) 11rem, 13rem"
                className="object-cover"
              />
            </div>
            <h2 className="display text-xl mt-6 leading-snug italic text-balance group-hover:text-ink-soft">
              {g.name}
            </h2>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/ustawienia"
          className="eyebrow text-ink-faded hover:text-ink underline underline-offset-4"
        >
          Ustawienia globalne
        </Link>
      </div>
    </main>
  );
}
