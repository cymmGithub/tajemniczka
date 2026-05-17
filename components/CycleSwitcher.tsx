import Link from "next/link";
import { addMonths } from "@/lib/rotation/cycle";
import { MONTHS_PL_TITLE } from "@/lib/i18n/pl";
import type { Anchor } from "@/lib/rotation/ring";

export function CycleSwitcher({
  start,
  anchor,
  basePath,
}: {
  start: { year: number; month: number };
  anchor: Anchor;
  basePath: string;
}) {
  const prev = addMonths(start.year, start.month, -20);
  const next = addMonths(start.year, start.month, 20);
  const end = addMonths(start.year, start.month, 19);
  const prevIsBeforeAnchor =
    prev.year < anchor.year ||
    (prev.year === anchor.year && prev.month < anchor.month);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-4">
      <h2 className="display text-3xl text-center italic heading-rule mb-3">
        Cykl rotacji
      </h2>
      <p className="text-center text-base italic text-ink-soft mb-1">
        {MONTHS_PL_TITLE[start.month - 1]}{" "}
        <span className="not-italic text-ink-faded">
          {start.year}
        </span>{" "}
        →{" "}
        {MONTHS_PL_TITLE[end.month - 1]}{" "}
        <span className="not-italic text-ink-faded">{end.year}</span>
      </p>
      <p className="text-center text-xs italic text-ink-faded mb-4">
        20 miesięcy — każdy slot odwiedzi każdą tajemnicę raz
      </p>
      <nav className="flex items-center justify-between text-base mb-4 px-1">
        {prevIsBeforeAnchor ? (
          <span className="italic text-paper-shadow py-2 pr-3 cursor-not-allowed whitespace-nowrap">
            ‹ Poprzedni cykl
          </span>
        ) : (
          <Link
            href={`${basePath}?view=year&y=${prev.year}&m=${prev.month}`}
            className="italic text-ink-soft hover:text-ink py-2 pr-3 whitespace-nowrap"
          >
            ‹ Poprzedni cykl
          </Link>
        )}
        <Link
          href={`${basePath}?view=year&y=${next.year}&m=${next.month}`}
          className="italic text-ink-soft hover:text-ink py-2 pl-3 whitespace-nowrap"
        >
          Następny cykl ›
        </Link>
      </nav>
    </div>
  );
}
