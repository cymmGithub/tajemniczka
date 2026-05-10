import Link from "next/link";
import { T } from "@/lib/i18n/pl";

export function MonthSwitcher({ year, month }: { year: number; month: number }) {
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return (
    <nav className="flex items-center justify-between text-sm py-3">
      <Link href={`/?y=${prev.y}&m=${prev.m}`} className="text-blue-700 px-3 py-2">
        ←
      </Link>
      <span className="font-semibold">{T.monthLabel(year, month)}</span>
      <Link href={`/?y=${next.y}&m=${next.m}`} className="text-blue-700 px-3 py-2">
        →
      </Link>
    </nav>
  );
}
