import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth/session";
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
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {authed && (
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
            <nav className="flex items-center justify-between max-w-xl mx-auto p-3 text-sm">
              <div className="flex gap-4">
                <Link href="/">{T.nav.tablica}</Link>
                <Link href="/czlonkowie">{T.nav.czlonkowie}</Link>
                <Link href="/historia">{T.nav.historia}</Link>
                <Link href="/ustawienia">{T.nav.ustawienia}</Link>
              </div>
              <form action="/logout" method="post">
                <button className="text-slate-600 underline">{T.nav.logout}</button>
              </form>
            </nav>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
