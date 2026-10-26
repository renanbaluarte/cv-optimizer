import Link from "next/link";
import { listAnalyses } from "@/lib/analyses";
import { intlLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { getSessionId } from "@/lib/session";
import { DeleteAnalysisButton } from "./delete-analysis-button";

export async function HistoryList({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const dateFormat = new Intl.DateTimeFormat(intlLocale[locale], {
    dateStyle: "short",
    timeStyle: "short",
  });
  const sessionId = await getSessionId();
  const analyses = sessionId ? await listAnalyses(sessionId) : [];

  if (!analyses.length) return null;

  return (
    <section className="section pt-0">
      <div className="container">
        <h2 className="title is-5">{dict.home.history}</h2>
        <div className="table-container">
          <table className="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th className="has-text-right" style={{ width: "4rem" }}>
                  {dict.history.score}
                </th>
                <th>{dict.history.job}</th>
                <th>{dict.history.date}</th>
                <th aria-label={dict.history.actions} />
              </tr>
            </thead>
            <tbody>
              {analyses.map((analysis) => (
                <tr key={analysis.id}>
                  <td className="has-text-right num has-text-weight-semibold">
                    {analysis.score}
                  </td>
                  <td>
                    <Link href={`/${locale}/analyses/${analysis.id}`}>
                      {analysis.jobTitle}
                    </Link>
                  </td>
                  <td className="num is-size-7 has-text-grey is-vcentered">
                    {dateFormat.format(new Date(analysis.createdAt))}
                  </td>
                  <td className="has-text-right">
                    <DeleteAnalysisButton id={analysis.id} dict={dict} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
