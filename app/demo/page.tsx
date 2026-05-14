import Link from "next/link";
import { assignment } from "@/lib/rotation/algorithm";
import { T, MONTHS_PL_TITLE } from "@/lib/i18n/pl";
import type { TajemnicaCode } from "@/lib/rotation/ring";

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
  { slot: 18, name: null,                phone: null },
  { slot: 19, name: "Urbaś Andrzej",     phone: "+48500000019" },
  { slot: 20, name: "Szczęsny Marian",   phone: "+48500000020" },
];

const YEAR = 2026;
const MONTH = 6;

function Tajemnica({ roman, group }: { roman: string; group: TajemnicaCode }) {
  return (
    <span className="tajemnica">
      <span className="roman">{roman}</span>
      <span className="group" data-group={group}>{group}</span>
    </span>
  );
}

function Masthead() {
  return (
    <header className="pt-7 pb-4 text-center">
      <div className="eyebrow mb-1">Kółko Różańcowe</div>
      <h1 className="display text-4xl text-ink leading-none">Tajemniczka</h1>
      <div className="fleuron mt-3 mx-auto max-w-[16rem] text-sm">
        <span>✦</span>
      </div>
    </header>
  );
}

function NavBar() {
  return (
    <nav className="border-y border-paper-shadow bg-paper-deep/40">
      <ul className="flex items-center justify-center gap-6 max-w-xl mx-auto py-3 text-[0.95rem]">
        <li><Link href="#tablica" className="rubric">Tablica</Link></li>
        <li><Link href="#czlonkowie" className="eyebrow">Członkowie</Link></li>
        <li><Link href="#historia" className="eyebrow">Historia</Link></li>
        <li><Link href="#ustawienia" className="eyebrow">Ustawienia</Link></li>
      </ul>
    </nav>
  );
}

function ScreenLabel({ id, title }: { id: string; title: string }) {
  return (
    <div id={id} className="mt-14 mb-4 max-w-xl mx-auto px-5">
      <div className="fleuron text-xs">
        <span className="eyebrow">{title}</span>
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="px-5 py-6">
      <div className="card-paper max-w-sm mx-auto p-7">
        <div className="text-center mb-5">
          <div className="eyebrow">Wejście</div>
          <h2 className="display text-2xl mt-1">Zaloguj</h2>
        </div>
        <label className="block">
          <span className="eyebrow">{T.login.passwordLabel}</span>
          <input
            type="password"
            className="mt-2 block w-full bg-paper border border-paper-shadow focus:border-marian outline-none p-3 text-lg font-body"
            readOnly
          />
        </label>
        <button
          type="button"
          className="mt-5 w-full p-3 text-lg bg-ink text-paper font-display tracking-wide"
        >
          {T.login.submit}
        </button>
      </div>
    </div>
  );
}

function Tablica() {
  return (
    <main className="px-5 py-6 max-w-xl mx-auto">
      <h2 className="display text-3xl text-center heading-rule mb-5 italic">
        {MONTHS_PL_TITLE[MONTH - 1]} <span className="text-ink-faded">{YEAR}</span>
      </h2>
      <nav className="flex items-center justify-between text-base mb-5 px-1">
        <span className="italic text-ink-soft">
          ‹ {MONTHS_PL_TITLE[MONTH - 2]}
        </span>
        <span className="rubric">Bieżący miesiąc</span>
        <span className="italic text-ink-soft">
          {MONTHS_PL_TITLE[MONTH]} ›
        </span>
      </nav>

      <ol className="card-paper divide-y divide-paper-shadow">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const tj = assignment(slot, YEAR, MONTH);
          const m = DEMO_MEMBERS.find((d) => d.slot === slot);
          return (
            <li key={slot} className="flex items-baseline gap-4 px-4 py-3">
              <span className="font-display text-base text-ink-faded w-7 tabular-nums">
                {slot}.
              </span>
              <span className="flex-1 text-lg leading-snug">
                {m?.name ? (
                  m.name
                ) : (
                  <span className="vacant">— wakat —</span>
                )}
              </span>
              <Tajemnica roman={tj.roman} group={tj.group} />
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex items-center justify-between text-sm text-ink-faded">
        <span className="italic">Ostatnia wysyłka: 30 kwietnia 2026</span>
        <span className="rubric">Sukces</span>
      </div>

      <button className="mt-4 text-sm rubric underline underline-offset-4 btn-link">
        Pokaż numery telefonów
      </button>
    </main>
  );
}

function Czlonkowie() {
  return (
    <main className="px-5 py-6 max-w-xl mx-auto">
      <h2 className="display text-3xl heading-rule mb-5">Członkowie</h2>
      <ul className="card-paper divide-y divide-paper-shadow">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const m = DEMO_MEMBERS.find((d) => d.slot === slot);
          return (
            <li key={slot} className="flex items-baseline gap-4 px-4 py-3">
              <span className="font-display text-base text-ink-faded w-7 tabular-nums">
                {slot}.
              </span>
              <span className="flex-1 text-lg">
                {m?.name ?? <span className="vacant">— miejsce wolne —</span>}
              </span>
              <span className="rubric text-sm underline underline-offset-4 btn-link">
                {m?.name ? "Edytuj" : "Dodaj"}
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
    <main className="px-5 py-6 max-w-xl mx-auto">
      <h2 className="display text-3xl heading-rule mb-5">Historia</h2>
      <ul className="card-paper divide-y divide-paper-shadow">
        <li className="flex items-baseline gap-4 px-4 py-4">
          <div className="flex-1">
            <div className="display text-xl italic">Czerwiec 2026</div>
            <div className="text-sm text-ink-soft mt-1">
              <span className="rubric">Sukces</span>
              <span className="text-ink-faded"> · Wysłano 19 z 19</span>
            </div>
          </div>
          <span className="text-sm underline underline-offset-4">Szczegóły</span>
        </li>
        <li className="flex items-baseline gap-4 px-4 py-4">
          <div className="flex-1">
            <div className="display text-xl italic">Maj 2026</div>
            <div className="text-sm mt-1">
              <span className="rubric">Niepowodzenie</span>
              <span className="text-ink-faded"> · Wysłano 18 z 19</span>
              <div className="text-ink-soft italic mt-1 text-sm">
                Nie dostarczono: Woźniak Stanisław
              </div>
            </div>
          </div>
          <span className="text-sm underline underline-offset-4">Szczegóły</span>
        </li>
        <li className="flex items-baseline gap-4 px-4 py-4">
          <div className="flex-1">
            <div className="display text-xl italic">Kwiecień 2026</div>
            <div className="text-sm text-ink-soft mt-1">
              <span className="rubric">Sukces</span>
              <span className="text-ink-faded"> · Wysłano 19 z 19</span>
            </div>
          </div>
          <span className="text-sm underline underline-offset-4">Szczegóły</span>
        </li>
      </ul>
    </main>
  );
}

function Ustawienia() {
  return (
    <main className="px-5 py-6 max-w-xl mx-auto space-y-7">
      <h2 className="display text-3xl heading-rule">Ustawienia</h2>

      <section>
        <div className="eyebrow mb-2">Wysyłka</div>
        <div className="card-paper p-4 space-y-3">
          <button
            type="button"
            className="w-full text-left flex items-center justify-between gap-3"
          >
            <span className="display text-lg">Pauza wysyłki</span>
            <span className="rubric text-sm">wyłączona</span>
          </button>
          <p className="text-sm text-ink-soft italic">
            Gdy włączone, najbliższa wysyłka SMS zostanie pominięta.
          </p>
        </div>
      </section>

      <section>
        <div className="eyebrow mb-2">Test</div>
        <button
          type="button"
          className="w-full p-3 text-lg bg-marian text-paper font-display tracking-wide"
        >
          Wyślij testowy SMS
        </button>
      </section>

      <section>
        <div className="eyebrow mb-2">Bezpieczeństwo</div>
        <div className="card-paper p-4 space-y-3">
          <h3 className="display text-lg">Zmień hasło</h3>
          <input
            type="password"
            placeholder="Obecne hasło"
            className="block w-full bg-paper border border-paper-shadow p-3 text-base"
            readOnly
          />
          <input
            type="password"
            placeholder="Nowe hasło"
            className="block w-full bg-paper border border-paper-shadow p-3 text-base"
            readOnly
          />
          <input
            type="password"
            placeholder="Potwierdź nowe hasło"
            className="block w-full bg-paper border border-paper-shadow p-3 text-base"
            readOnly
          />
          <button
            type="button"
            className="w-full p-3 text-base bg-ink text-paper font-display tracking-wide"
          >
            Zmień hasło
          </button>
        </div>
      </section>
    </main>
  );
}

export default function DemoPage() {
  return (
    <div>
      <div className="bg-rubric text-paper text-xs py-1.5 px-3 text-center font-display tracking-wide">
        Tryb demo — dane statyczne, brak DB
      </div>
      <Masthead />
      <NavBar />

      <ScreenLabel id="login-label" title="Ekran logowania" />
      <LoginScreen />

      <ScreenLabel id="tablica" title="Tablica miesięczna" />
      <Tablica />

      <ScreenLabel id="czlonkowie" title="Spis członków" />
      <Czlonkowie />

      <ScreenLabel id="historia" title="Historia wysyłek" />
      <Historia />

      <ScreenLabel id="ustawienia" title="Ustawienia aplikacji" />
      <Ustawienia />

      <footer className="mt-16 pb-8 pt-4 text-center border-t border-paper-shadow">
        <div className="fleuron text-xs italic max-w-[12rem] mx-auto text-ink-faded">
          <span>Ad Maiorem Dei Gloriam</span>
        </div>
      </footer>
    </div>
  );
}
