"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

type Props = { current: Locale; label: string };

export function LanguageLinks({
  current,
  label,
  rest = "",
}: Props & { rest?: string }) {
  return (
    <nav className="lang-switch" aria-label={label}>
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

export function LanguageSwitch(props: Props) {
  const rest = usePathname().replace(/^\/[^/]+/, "");
  return <LanguageLinks {...props} rest={rest} />;
}
