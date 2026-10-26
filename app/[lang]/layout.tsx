import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import { LanguageLinks, LanguageSwitch } from "@/components/language-switch";
import { getDictionary, hasLocale, locales } from "@/lib/i18n";
import "bulma/css/bulma.min.css";
import "../globals.css";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return getDictionary(lang).meta;
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html
      lang={lang === "pt" ? "pt-BR" : "en"}
      data-theme="light"
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body>
        <nav className="navbar app-navbar" aria-label="Main">
          <div className="container is-flex is-justify-content-space-between is-align-items-center">
            <div className="navbar-brand">
              <Link href={`/${lang}`} className="navbar-item app-brand">
                CV <em>Optimizer</em>
              </Link>
            </div>
            <div className="px-3">
              <Suspense
                fallback={
                  <LanguageLinks current={lang} label={dict.nav.language} />
                }
              >
                <LanguageSwitch current={lang} label={dict.nav.language} />
              </Suspense>
            </div>
          </div>
        </nav>
        {children}
        <footer className="app-footer">
          <div className="container is-size-7 has-text-grey">
            {dict.footer.builtBy}{" "}
            <a
              href="https://github.com/renanbaluarte"
              target="_blank"
              rel="noopener noreferrer"
            >
              Renan Ferreira
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
