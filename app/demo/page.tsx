import Link from "next/link";
import { assignment } from "@/lib/rotation/algorithm";
import { T, MONTHS_PL_TITLE } from "@/lib/i18n/pl";

// Hardcoded demo data — no DB, no env vars, pure UI preview.

const DEMO_MEMBERS = [
  { slot: 1,  name: "Wysocki Roman",     phone: "+48500000001" },
  { slot: 2,  name: "Firlej Krzysztof",  phone: "+48500000002" },
  { slot: 3,  name: "Gieroba Andrzej",   phone: "+48500000003" },
  { slot: 4,  name: "Buczek Janusz",     phone: "+48500000004" },
  { slot: 5,  name: "Olszewski Robert",  phone: "+48500000005" },
  { slot: 6,  name: "Cyrkiel Sławomir",  phone: "+48500000006" },
  { slot: 7,  name: "Woźniak Stanisław", phone: "+48500000007" },
  { slot: 8,  name: "Inkwanty Tadeusz",  phone: "+48500000008" },
  { slot: 9,  name: "Inkwanty Piotr",    phone: "+48500000009" },
  { slot: 10, name: "Greguła Piotr",     phone: "+48500000010" },
  { slot: 11, name: "Zgierski Zbigniew", phone: "+48500000011" },
  { slot: 12, name: "Łopucki Tadeusz",   phone: "+48500000012" },
  { slot: 13, name: "Sztorc Roman",      phone: "+48500000013" },
  { slot: 14, name: "Budzyński Andrzej", phone: "+48500000014" },
  { slot: 15, name: "Choina Edward",     phone: "+48500000015" },
  { slot: 16, name: "Muzyka Stanisław",  phone: "+48500000016" },
  { slot: 17, name: "Dumański Tomasz",   phone: "+48500000017" },
  { slot: 18, name: null,                phone: null }, // vacant slot
  { slot: 19, name: "Urbaś Andrzej",     phone: "+48500000019" },
  { slot: 20, name: "Szczęsny Marian",   phone: "+48500000020" },
];

const YEAR = 2026;
const MONTH = 6; // czerwiec 2026 — anchor month

function NavBar() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <nav className="flex items-center justify-between max-w-xl mx-auto p-3 text-sm">
        <div className="flex gap-4">
          <Link href="#tablica" className="font-semibold">{T.nav.tablica}</Link>
          <Link href="#czlonkowie">{T.nav.czlonkowie}</Link>
          <Link href="#historia">{T.nav.historia}</Link>
          <Link href="#ustawienia">{T.nav.ustawienia}</Link>
        </div>
        <button className="text-slate-600 underline">{T.nav.logout}</button>
      </nav>
    </header>
  );
}

function ScreenLabel({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="mt-12 mb-2 text-xs uppercase tracking-wider text-slate-400 px-4 max-w-xl mx-auto"
    >
      Ekran: {title}
    </h2>
  );
}

function Tablica() {
  return (
    <main className="p-4 max-w-xl mx-auto">
      <nav className="flex items-center justify-between text-sm py-3">
        <span className="text-blue-700 px-3 py-2">←</span>
        <span className="font-semibold">{MONTHS_PL_TITLE[MONTH - 1]} {YEAR}</span>
        <span className="text-blue-700 px-3 py-2">→</span>
      </nav>
      <ol className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const tj = assignment(slot, YEAR, MONTH);
          const m = DEMO_MEMBERS.find((d) => d.slot === slot);
          return (
            <li key={slot} className="flex items-center gap-3 p-3 text-base">
              <span className="font-mono w-8 text-slate-500">{slot}</span>
              <span className="flex-1">
                {m?.name ? m.name : <em className="text-slate-400">{T.vacant}</em>}
              </span>
              <span className="font-semibold tabular-nums">{tj.short}</span>
            </li>
          );
        })}
      </ol>
      <button className="text-sm text-blue-700 underline mt-4">{T.showPhones}</button>
      <p className="text-sm text-slate-600 mt-4">
        Ostatnia wysyłka:{" "}
        <span className="text-green-700">Sukces</span> (30.04.2026)
      </p>
    </main>
  );
}

function Czlonkowie() {
  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{T.members.title}</h1>
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const m = DEMO_MEMBERS.find((d) => d.slot === slot);
          return (
            <li key={slot} className="flex items-center justify-between gap-3 p-3">
              <span className="font-mono w-8 text-slate-500">{slot}</span>
              <span className="flex-1">
                {m?.name ?? <em className="text-slate-400">{T.members.add}</em>}
              </span>
              <span className="text-blue-700 underline text-sm">
                {m?.name ? "Edytuj" : T.members.add}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Historia() {
  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{T.history.title}</h1>
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        <li className="p-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Czerwiec 2026</div>
            <div className="text-sm text-slate-600">
              Sukces · {T.history.sentCount(19, 19)}
            </div>
          </div>
          <span className="text-blue-700 underline text-sm">{T.history.details}</span>
        </li>
        <li className="p-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Maj 2026</div>
            <div className="text-sm text-red-700">
              Częściowo niepowodzenie · {T.history.sentCount(18, 19)}
            </div>
          </div>
          <span className="text-blue-700 underline text-sm">{T.history.details}</span>
        </li>
        <li className="p-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Kwiecień 2026</div>
            <div className="text-sm text-slate-600">
              Sukces · {T.history.sentCount(19, 19)}
            </div>
          </div>
          <span className="text-blue-700 underline text-sm">{T.history.details}</span>
        </li>
      </ul>
    </main>
  );
}

function Ustawienia() {
  return (
    <main className="p-4 max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">{T.settings.title}</h1>
      <section className="space-y-2">
        <button className="w-full rounded bg-slate-900 text-white p-3">
          {T.settings.pauseLabel} wyłączona
        </button>
        <p className="text-sm text-slate-600">{T.settings.pauseHelp}</p>
      </section>
      <section>
        <button className="w-full rounded bg-blue-700 text-white p-3">
          {T.settings.sendTest}
        </button>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{T.settings.changePassword}</h2>
        <form className="space-y-3">
          <input
            type="password"
            placeholder={T.settings.currentPassword}
            className="block w-full rounded border border-slate-300 p-3"
            readOnly
          />
          <input
            type="password"
            placeholder={T.settings.newPassword}
            className="block w-full rounded border border-slate-300 p-3"
            readOnly
          />
          <input
            type="password"
            placeholder={T.settings.confirmPassword}
            className="block w-full rounded border border-slate-300 p-3"
            readOnly
          />
          <button type="button" className="w-full rounded bg-slate-900 text-white p-3">
            {T.settings.changePassword}
          </button>
        </form>
      </section>
    </main>
  );
}

function LoginScreen() {
  return (
    <main className="flex items-center justify-center p-6 bg-slate-100">
      <form className="w-full max-w-sm space-y-4 bg-white p-6 rounded">
        <h1 className="text-2xl font-semibold">{T.login.title}</h1>
        <label className="block">
          <span className="text-sm text-slate-700">{T.login.passwordLabel}</span>
          <input
            type="password"
            className="mt-1 block w-full rounded border border-slate-300 p-3 text-base"
            readOnly
          />
        </label>
        <button type="button" className="w-full rounded bg-slate-900 text-white p-3 text-base">
          {T.login.submit}
        </button>
      </form>
    </main>
  );
}

export default function DemoPage() {
  return (
    <div className="bg-slate-50">
      <div className="bg-amber-100 text-amber-900 text-xs p-2 text-center sticky top-0 z-20">
        Tryb demo — dane statyczne, brak DB. Wszystkie ekrany na jednej stronie.
      </div>
      <NavBar />

      <ScreenLabel id="login-label" title="/login" />
      <LoginScreen />

      <ScreenLabel id="tablica" title="/ (Tablica)" />
      <Tablica />

      <ScreenLabel id="czlonkowie" title="/czlonkowie" />
      <Czlonkowie />

      <ScreenLabel id="historia" title="/historia" />
      <Historia />

      <ScreenLabel id="ustawienia" title="/ustawienia" />
      <Ustawienia />

      <div className="h-16" />
    </div>
  );
}
