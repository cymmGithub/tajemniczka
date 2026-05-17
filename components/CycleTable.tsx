import { assignment } from "@/lib/rotation/algorithm";
import { cycleMonths } from "@/lib/rotation/cycle";
import { MONTHS_PL_SHORT } from "@/lib/i18n/pl";
import type { Anchor } from "@/lib/rotation/ring";
import { Tajemnica } from "./Tajemnica";

function isCurrent(
  m: { year: number; month: number },
  now: Date,
): boolean {
  return m.year === now.getFullYear() && m.month === now.getMonth() + 1;
}

export function CycleTable({
  start,
  bySlot,
  now,
  anchor,
}: {
  start: { year: number; month: number };
  bySlot: Map<number, { name: string }>;
  now: Date;
  anchor: Anchor;
}) {
  const months = cycleMonths(start);
  const slots = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="cycle-wrapper">
      <div className="overflow-x-auto pb-2">
        <table className="cycle-table">
          <thead>
            <tr>
              <th className="sticky-col">Slot</th>
              {months.map((m, i) => (
                <th
                  key={i}
                  className={isCurrent(m, now) ? "current-month" : ""}
                  title={`${MONTHS_PL_SHORT[m.month - 1]} ${m.year}`}
                >
                  <div>{MONTHS_PL_SHORT[m.month - 1]}</div>
                  <div className="text-[0.7em] text-ink-faded mt-0.5">
                    '{String(m.year).slice(-2)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              const member = bySlot.get(slot);
              const vacant = !member;
              return (
                <tr key={slot} className={vacant ? "row-vacant" : ""}>
                  <th className="sticky-col">
                    <span className="slot-num">{slot}.</span>
                    {member ? (
                      <span className="member-name" title={member.name}>
                        {member.name}
                      </span>
                    ) : (
                      <span className="vacant">— wakat —</span>
                    )}
                  </th>
                  {months.map((m, i) => {
                    const tj = assignment(slot, m.year, m.month, anchor);
                    return (
                      <td
                        key={i}
                        className={isCurrent(m, now) ? "current-month" : ""}
                      >
                        <Tajemnica
                          roman={tj.roman}
                          group={tj.group}
                          compact
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="cycle-fade-right" aria-hidden />
    </div>
  );
}
