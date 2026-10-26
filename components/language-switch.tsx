"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

type Props = { current: Locale; label: string };

export function LanguageLinks({ current, label, rest = "" }: Props & { rest?: string }) {
  return (
    <div className="buttons has-addons" role="group" aria-label={label}>
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          className={`button is-small mono ${locale === current ? "is-primary is-selected" : ""}`}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

export function LanguageSwitch(props: Props) {
  const rest = usePathname().replace(/^\/[^/]+/, "");
  return <LanguageLinks {...props} rest={rest} />;
}
