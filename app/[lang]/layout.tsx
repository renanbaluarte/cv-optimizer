import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { LanguageLinks, LanguageSwitch } from "@/components/language-switch";
import { getDictionary, hasLocale, locales } from "@/lib/i18n";
import "bulma/css/bulma.min.css";
import "../globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return getDictionary(lang).meta;
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html lang={lang === "pt" ? "pt-BR" : "en"} className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <nav className="navbar app-navbar" aria-label="Main">
          <div className="container is-flex is-justify-content-space-between is-align-items-center">
            <div className="navbar-brand">
              <Link href={`/${lang}`} className="navbar-item app-brand">
                cv<span>/</span>optimizer
              </Link>
            </div>
            <div className="px-3">
              <Suspense fallback={<LanguageLinks current={lang} label={dict.nav.language} />}>
                <LanguageSwitch current={lang} label={dict.nav.language} />
              </Suspense>
            </div>
          </div>
        </nav>
        {children}
        <footer className="app-footer">
          <div className="container is-size-7 has-text-grey">{dict.footer}</div>
        </footer>
      </body>
    </html>
  );
}
