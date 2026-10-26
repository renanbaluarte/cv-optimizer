"use client";

import { useState, useTransition } from "react";
import { rewriteSummaryAction } from "@/app/actions";
import type { AnalysisView } from "@/lib/analyses";
import type { Dictionary } from "@/lib/i18n";

function scoreTone(score: number, report: Dictionary["report"]) {
  if (score >= 75) return { color: "success", label: report.high };
  if (score >= 50) return { color: "warning", label: report.medium };
  return { color: "danger", label: report.low };
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="column">
      <h3 className="section-label">{title}</h3>
      {items.length ? (
        <div className="content">
          <ul className="mt-0">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="has-text-grey">{empty}</p>
      )}
    </div>
  );
}

export function AnalysisReport({ analysis, dict }: { analysis: AnalysisView; dict: Dictionary }) {
  const { score, feedback } = analysis;
  const t = dict.report;
  const tone = scoreTone(score, t);
  const [rewritten, setRewritten] = useState(analysis.rewrittenSummary);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRewriting, startRewrite] = useTransition();

  function handleRewrite() {
    setError(null);
    startRewrite(async () => {
      const result = await rewriteSummaryAction(analysis.id);
      if (result.ok) setRewritten(result.data);
      else setError(dict.errors[result.error]);
    });
  }

  async function handleCopy() {
    if (!rewritten) return;
    try {
      await navigator.clipboard.writeText(rewritten);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.copyFailed);
    }
  }

  return (
    <article className="box">
      <div className="report-block">
        <p className="section-label">{analysis.jobTitle}</p>
        <div className="is-flex is-align-items-baseline mb-3" style={{ gap: "0.75rem" }}>
          <span className={`score has-text-${tone.color}`}>{score}</span>
          <span className="has-text-grey">/ 100 · {tone.label}</span>
        </div>
        <progress className={`progress is-small is-${tone.color}`} value={score} max={100} aria-label={t.scoreLabel}>
          {score}%
        </progress>
        {feedback.summary && <p>{feedback.summary}</p>}
      </div>

      <div className="report-block">
        <h3 className="section-label">{t.missingKeywords}</h3>
        {feedback.missingKeywords.length ? (
          <div className="tags">
            {feedback.missingKeywords.map((keyword) => (
              <span key={keyword} className="tag is-danger is-light mono">
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="has-text-grey">{t.noMissingKeywords}</p>
        )}
      </div>

      <div className="report-block">
        <div className="columns">
          <ListBlock title={t.strengths} items={feedback.strengths} empty={t.noStrengths} />
          <ListBlock title={t.improvements} items={feedback.improvements} empty={t.noImprovements} />
        </div>
      </div>

      <div className="report-block">
        <div className="level is-mobile mb-3">
          <div className="level-left">
            <h3 className="section-label mb-0">{t.rewriteTitle}</h3>
          </div>
          <div className="level-right">
            <button
              type="button"
              onClick={handleRewrite}
              disabled={isRewriting}
              className={`button is-small is-primary is-outlined ${isRewriting ? "is-loading" : ""}`}
            >
              {rewritten ? t.rewriteAgain : t.rewrite}
            </button>
          </div>
        </div>
        {rewritten ? (
          <>
            <p className="rewritten">{rewritten}</p>
            <button type="button" onClick={handleCopy} className="button is-small is-text mt-2">
              {copied ? t.copied : t.copy}
            </button>
          </>
        ) : (
          <p className="has-text-grey is-size-7">
            {t.rewriteHint}
          </p>
        )}
        {error && (
          <p role="alert" className="help is-danger">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
