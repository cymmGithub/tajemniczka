import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth/session";
import { Masthead } from "@/components/Masthead";
import { T } from "@/lib/i18n/pl";

export const metadata: Metadata = {
  title: "Tajemniczka",
  description: "Kółko różańcowe — automatyczne przypomnienia tajemnic",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  return (
    <html lang="pl">
      <body className="min-h-screen flex flex-col">
        <Masthead />
        {authed && (
          <nav className="border-y border-[--color-paper-shadow] bg-[--color-paper-deep]/40">
            <ul className="flex items-center justify-center gap-5 max-w-xl mx-auto py-3 text-[0.95rem]">
              <li>
                <Link href="/" className="eyebrow hover:text-[--color-ink]">
                  {T.nav.tablica}
                </Link>
              </li>
              <li>
                <Link href="/czlonkowie" className="eyebrow hover:text-[--color-ink]">
                  {T.nav.czlonkowie}
                </Link>
              </li>
              <li>
                <Link href="/historia" className="eyebrow hover:text-[--color-ink]">
                  {T.nav.historia}
                </Link>
              </li>
              <li>
                <Link href="/ustawienia" className="eyebrow hover:text-[--color-ink]">
                  {T.nav.ustawienia}
                </Link>
              </li>
              <li className="border-l border-[--color-paper-shadow] pl-5 ml-1">
                <form action="/logout" method="post">
                  <button type="submit" className="eyebrow hover:text-[--color-rubric]">
                    {T.nav.logout}
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        )}
        <div className="flex-1">{children}</div>
        <footer className="mt-12 pb-7 pt-5 text-center border-t border-[--color-paper-shadow]">
          <div className="fleuron text-xs italic max-w-[12rem] mx-auto text-[--color-ink-faded]">
            <span>Ad Maiorem Dei Gloriam</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
