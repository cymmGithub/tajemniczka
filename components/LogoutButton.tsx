import { T } from "@/lib/i18n/pl";

export function LogoutButton() {
  return (
    <form
      action="/logout"
      method="post"
      className="fixed top-3 right-3 z-50"
    >
      <button
        type="submit"
        aria-label={T.nav.logout}
        title={T.nav.logout}
        className="text-ink-faded hover:text-rubric p-2 transition-colors cursor-pointer"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </form>
  );
}
