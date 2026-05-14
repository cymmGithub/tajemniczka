import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth/session";
import { Masthead } from "@/components/Masthead";
import { LogoutButton } from "@/components/LogoutButton";
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
        <div className="relative">
          <Masthead />
          {authed && <LogoutButton />}
        </div>
        {authed && (
          <nav className="border-y border-paper-shadow bg-paper-deep/40">
            <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0 max-w-xl mx-auto px-2 py-2 text-[0.82rem]">
              <li>
                <Link href="/" className="eyebrow hover:text-ink block px-2 py-2">
                  {T.nav.tablica}
                </Link>
              </li>
              <li>
                <Link href="/czlonkowie" className="eyebrow hover:text-ink block px-2 py-2">
                  {T.nav.czlonkowie}
                </Link>
              </li>
              <li>
                <Link href="/historia" className="eyebrow hover:text-ink block px-2 py-2">
                  {T.nav.historia}
                </Link>
              </li>
              <li>
                <Link href="/ustawienia" className="eyebrow hover:text-ink block px-2 py-2">
                  {T.nav.ustawienia}
                </Link>
              </li>
            </ul>
          </nav>
        )}
        <div className="flex-1">{children}</div>
        <footer className="mt-12 pb-7 pt-5 text-center border-t border-paper-shadow">
          <div className="fleuron text-xs italic max-w-[12rem] mx-auto text-ink-faded">
            <span>Ad Maiorem Dei Gloriam</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
