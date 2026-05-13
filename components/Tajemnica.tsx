import type { TajemnicaCode } from "@/lib/rotation/ring";

export function Tajemnica({
  roman,
  group,
  compact = false,
}: {
  roman: string;
  group: TajemnicaCode;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span className="tajemnica-chip" data-group={group}>
        {roman}
        {group}
      </span>
    );
  }
  return (
    <span className="tajemnica">
      <span className="roman">{roman}</span>
      <span className="group" data-group={group}>
        {group}
      </span>
    </span>
  );
}
