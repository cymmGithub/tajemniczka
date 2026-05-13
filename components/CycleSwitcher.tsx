import Link from "next/link";
import { addMonths } from "@/lib/rotation/cycle";
import { MONTHS_PL_TITLE } from "@/lib/i18n/pl";
import { ANCHOR_YEAR, ANCHOR_MONTH } from "@/lib/rotation/ring";

export function CycleSwitcher({
  start,
}: {
  start: { year: number; month: number };
}) {
  const prev = addMonths(start.year, start.month, -20);
  const next = addMonths(start.year, start.month, 20);
  const end = addMonths(start.year, start.month, 19);
  const prevIsBeforeAnchor =
    prev.year < ANCHOR_YEAR ||
    (prev.year === ANCHOR_YEAR && prev.month < ANCHOR_MONTH);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-4">
      <h2 className="display text-3xl text-center italic heading-rule mb-3">
        Cykl rotacji
      </h2>
      <p className="text-center text-base italic text-[--color-ink-soft] mb-1">
        {MONTHS_PL_TITLE[start.month - 1]}{" "}
        <span className="not-italic text-[--color-ink-faded]">
          {start.year}
        </span>{" "}
        →{" "}
        {MONTHS_PL_TITLE[end.month - 1]}{" "}
        <span className="not-italic text-[--color-ink-faded]">{end.year}</span>
      </p>
      <p className="text-center text-xs italic text-[--color-ink-faded] mb-4">
        20 miesięcy — każdy slot odwiedzi każdą tajemnicę raz
      </p>
      <nav className="flex items-center justify-between text-base mb-4 px-1">
        {prevIsBeforeAnchor ? (
          <span className="italic text-[--color-paper-shadow] py-2 pr-3 cursor-not-allowed">
            ‹ Poprzedni cykl
          </span>
        ) : (
          <Link
            href={`/?view=year&y=${prev.year}&m=${prev.month}`}
            className="italic text-[--color-ink-soft] hover:text-[--color-ink] py-2 pr-3"
          >
            ‹ Poprzedni cykl
          </Link>
        )}
        <Link
          href={`/?view=year&y=${next.year}&m=${next.month}`}
          className="italic text-[--color-ink-soft] hover:text-[--color-ink] py-2 pl-3"
        >
          Następny cykl ›
        </Link>
      </nav>
    </div>
  );
}
