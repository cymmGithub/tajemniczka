/**
 * Pure-CSS toggle visual. Pure presentational — does not handle state.
 * Drop into a form/button. See `PauseToggle` for the controlled form version
 * with optimistic updates.
 */
export function Switch({ on, size = "md" }: { on: boolean; size?: "sm" | "md" }) {
  return (
    <span
      role="presentation"
      data-on={on}
      className={`pill-switch ${size === "sm" ? "pill-switch-sm" : ""}`}
    >
      <span className="pill-switch-thumb" />
    </span>
  );
}
