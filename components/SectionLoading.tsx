export function SectionLoading() {
  return (
    <main
      className="px-5 py-16 max-w-xl mx-auto flex flex-col items-center gap-3"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="btn-spinner text-ink-faded" aria-hidden="true" />
      <span className="eyebrow text-ink-faded">Wczytuję</span>
    </main>
  );
}
