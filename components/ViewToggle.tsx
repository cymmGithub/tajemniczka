import Link from "next/link";

export function ViewToggle({
  view,
  year,
  month,
}: {
  view: "month" | "year";
  year: number;
  month: number;
}) {
  const monthHref = `/?view=month&y=${year}&m=${month}`;
  const yearHref = `/?view=year&y=${year}&m=${month}`;
  const active = "rubric underline underline-offset-4 px-3 py-2";
  const inactive =
    "eyebrow hover:text-[--color-ink] px-3 py-2";
  return (
    <div className="flex justify-center gap-2 py-3 max-w-xl mx-auto border-b border-[--color-paper-shadow]">
      <Link href={monthHref} className={view === "month" ? active : inactive}>
        Miesiąc
      </Link>
      <Link href={yearHref} className={view === "year" ? active : inactive}>
        Cykl
      </Link>
    </div>
  );
}
