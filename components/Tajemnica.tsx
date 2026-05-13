import type { TajemnicaCode } from "@/lib/rotation/ring";

export function Tajemnica({
  roman,
  group,
}: {
  roman: string;
  group: TajemnicaCode;
}) {
  return (
    <span className="tajemnica">
      <span className="roman">{roman}</span>
      <span className="group" data-group={group}>
        {group}
      </span>
    </span>
  );
}
