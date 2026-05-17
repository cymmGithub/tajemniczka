import type { Metadata } from "next";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth/session";
import { LogoutButton } from "@/components/LogoutButton";

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
        {authed && <LogoutButton />}
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
