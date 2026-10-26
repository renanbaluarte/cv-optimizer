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
          <h1 className="title is-4">{dict.home.title}</h1>
          <p className="subtitle is-6 has-text-grey">{dict.home.subtitle}</p>
          <AnalyzeForm locale={lang} dict={dict} />
        </div>
      </section>

      <section className="section pt-0">
        <div className="container">
          <h2 className="section-label">{dict.home.history}</h2>
          <Suspense fallback={<p className="has-text-grey">{dict.home.loadingHistory}</p>}>
            <HistoryList locale={lang} dict={dict} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
