import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getGroup } from "@/lib/db/groups";
import { T } from "@/lib/i18n/pl";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const id = Number(groupId);
  const group = await getGroup(id);
  if (!group) notFound();

  const base = `/g/${group.id}`;

  return (
    <>
      <header className="pt-6 pb-3 text-center">
        <Link
          href="/"
          className="inline-flex flex-col items-center gap-2 group"
          aria-label="Wróć do wyboru kółka"
        >
          <span className="portrait-frame-sm relative block w-12 h-12">
            <Image
              src={group.imagePath}
              alt={group.shortLabel}
              fill
              sizes="3rem"
              className="object-cover"
            />
          </span>
          <span className="display text-base italic text-ink-soft group-hover:text-ink leading-tight max-w-xs">
            {group.name}
          </span>
        </Link>
      </header>

      <nav className="border-y border-paper-shadow bg-paper-deep/40">
        <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0 max-w-xl mx-auto px-2 py-2 text-[0.82rem]">
          <li>
            <Link href={`${base}/`} className="eyebrow hover:text-ink block px-2 py-2">
              {T.nav.tablica}
            </Link>
          </li>
          <li>
            <Link href={`${base}/czlonkowie`} className="eyebrow hover:text-ink block px-2 py-2">
              {T.nav.czlonkowie}
            </Link>
          </li>
          <li>
            <Link href={`${base}/historia`} className="eyebrow hover:text-ink block px-2 py-2">
              {T.nav.historia}
            </Link>
          </li>
          <li>
            <Link href={`${base}/ustawienia`} className="eyebrow hover:text-ink block px-2 py-2">
              {T.nav.ustawienia}
            </Link>
          </li>
        </ul>
      </nav>

      {children}
    </>
  );
}
