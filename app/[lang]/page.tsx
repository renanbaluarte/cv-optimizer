import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AnalyzeForm } from "@/components/analyze-form";
import { HistoryList } from "@/components/history-list";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <main>
      <section className="section">
        <div className="container">
          <header className="intro">
            <h1 className="title is-1 is-size-2-mobile">{dict.home.title}</h1>
            <p className="lede">{dict.home.subtitle}</p>
          </header>
          <AnalyzeForm locale={lang} dict={dict} />
        </div>
      </section>

      <Suspense fallback={null}>
        <HistoryList locale={lang} dict={dict} />
      </Suspense>
    </main>
  );
}
