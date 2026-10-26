"use client";

import {
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { analyzeAction } from "@/app/actions";
import type { AnalysisView } from "@/lib/analyses";
import {
  format,
  intlLocale,
  type Dictionary,
  type ErrorCode,
  type Locale,
} from "@/lib/i18n";
import { INPUT_LIMITS } from "@/lib/schemas";
import { AnalysisReport } from "./analysis-report";

const MAX_FILE_BYTES = 100_000;
const COUNTER_THRESHOLD = 0.8;

function CharCount({
  value,
  max,
  locale,
}: {
  value: string;
  max: number;
  locale: Locale;
}) {
  if (value.length < max * COUNTER_THRESHOLD) return null;
  const number = new Intl.NumberFormat(intlLocale[locale]);
  return (
    <span className="is-size-7 has-text-grey num">
      {number.format(value.length)} / {number.format(max)}
    </span>
  );
}

function errorMessage(dict: Dictionary, code: ErrorCode) {
  const limits = code.startsWith("resume")
    ? INPUT_LIMITS.resumeText
    : INPUT_LIMITS.jobDescription;
  return format(dict.errors[code], limits);
}

export function AnalyzeForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisView | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(dict.form.fileTooLarge);
      return;
    }
    setResumeText((await file.text()).slice(0, INPUT_LIMITS.resumeText.max));
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await analyzeAction(
        { resumeText, jobDescription },
        locale,
      );
      if (result.ok) setAnalysis(result.data);
      else setError(errorMessage(dict, result.error));
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} aria-busy={isPending}>
        <div className="columns">
          <div className="column">
            <div className="field">
              <label htmlFor="resume" className="label">
                {dict.form.resume}
              </label>
              <div className="control">
                <textarea
                  id="resume"
                  className="textarea is-cv"
                  required
                  minLength={INPUT_LIMITS.resumeText.min}
                  maxLength={INPUT_LIMITS.resumeText.max}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder={dict.form.resumePlaceholder}
                />
              </div>
              <div className="field-footer">
                <div className="file is-small">
                  <label className="file-label">
                    <input
                      className="file-input"
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      onChange={handleFile}
                    />
                    <span className="file-cta">
                      <span className="file-label">{dict.form.import}</span>
                    </span>
                  </label>
                </div>
                <CharCount
                  value={resumeText}
                  max={INPUT_LIMITS.resumeText.max}
                  locale={locale}
                />
              </div>
            </div>
          </div>

          <div className="column">
            <div className="field">
              <label htmlFor="job" className="label">
                {dict.form.job}
              </label>
              <div className="control">
                <textarea
                  id="job"
                  className="textarea is-cv"
                  required
                  minLength={INPUT_LIMITS.jobDescription.min}
                  maxLength={INPUT_LIMITS.jobDescription.max}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={dict.form.jobPlaceholder}
                />
              </div>
              <div className="field-footer is-justify-content-flex-end">
                <CharCount
                  value={jobDescription}
                  max={INPUT_LIMITS.jobDescription.max}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="field is-grouped is-align-items-center">
          <div className="control">
            <button
              type="submit"
              className={`button is-primary is-medium ${isPending ? "is-loading" : ""}`}
              disabled={isPending}
            >
              {dict.form.submit}
            </button>
          </div>
          {isPending && (
            <p className="control has-text-grey is-size-7">
              {dict.form.pendingHint}
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="notification is-danger is-light">
            {error}
          </div>
        )}
      </form>

      {analysis && (
        <div className="mt-6">
          <AnalysisReport key={analysis.id} analysis={analysis} dict={dict} />
        </div>
      )}
    </>
  );
}
