import Link from "next/link";
import { MONTHS_PL_TITLE } from "@/lib/i18n/pl";

export function MonthSwitcher({ year, month }: { year: number; month: number }) {
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return (
    <nav className="flex items-center justify-between text-base mb-5 px-1">
      <Link
        href={`/?y=${prev.y}&m=${prev.m}`}
        className="italic text-[--color-ink-soft] hover:text-[--color-ink] py-2 pr-3"
      >
        ‹ {MONTHS_PL_TITLE[prev.m - 1]}
      </Link>
      <span className="rubric">Bieżący miesiąc</span>
      <Link
        href={`/?y=${next.y}&m=${next.m}`}
        className="italic text-[--color-ink-soft] hover:text-[--color-ink] py-2 pl-3"
      >
        {MONTHS_PL_TITLE[next.m - 1]} ›
      </Link>
    </nav>
  );
}
