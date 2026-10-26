import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { AnalysisReport } from "@/components/analysis-report";
import { DeleteAnalysisButton } from "@/components/delete-analysis-button";
import { getAnalysis } from "@/lib/analyses";
import { getDictionary, hasLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { analysisIdSchema } from "@/lib/schemas";
import { getSessionId } from "@/lib/session";

type DetailProps = { params: Promise<{ id: string }>; locale: Locale; dict: Dictionary };

async function AnalysisDetail({ params, locale, dict }: DetailProps) {
  const parsedId = analysisIdSchema.safeParse((await params).id);
  const sessionId = await getSessionId();
  const analysis = parsedId.success && sessionId ? await getAnalysis(sessionId, parsedId.data) : null;
  if (!analysis) notFound();

  return (
    <>
      <div className="level is-mobile">
        <div className="level-left">
          <Link href={`/${locale}`}>{dict.detail.back}</Link>
        </div>
        <div className="level-right">
          <DeleteAnalysisButton id={analysis.id} dict={dict} redirectTo={`/${locale}`} />
        </div>
      </div>
      <AnalysisReport analysis={analysis} dict={dict} />
    </>
  );
}

export default async function AnalysisPage({ params }: PageProps<"/[lang]/analyses/[id]">) {
  const lang = await rootLang();
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <main>
      <section className="section">
        <div className="container is-max-tablet">
          <Suspense fallback={<p className="has-text-grey">{dict.detail.loading}</p>}>
            <AnalysisDetail params={params} locale={lang} dict={dict} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
