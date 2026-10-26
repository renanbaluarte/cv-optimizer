"use server";

import { refresh } from "next/cache";
import { AiError, analyzeResume, rewriteSummary, type AiErrorKind } from "@/lib/ai";
import { createAnalysis, deleteAnalysis, getAnalysisInput, saveRewrite, type AnalysisView } from "@/lib/analyses";
import type { ErrorCode } from "@/lib/i18n";
import { consumeLlmQuota } from "@/lib/rate-limit";
import { analysisIdSchema, analyzeInputSchema, inputErrorCode, localeSchema } from "@/lib/schemas";
import { getOrCreateSessionId, getSessionId } from "@/lib/session";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ErrorCode };

const AI_ERROR_CODES: Record<AiErrorKind, ErrorCode> = {
  not_configured: "ai_not_configured",
  unavailable: "ai_unavailable",
  invalid_output: "ai_invalid_output",
};

function fail(error: ErrorCode): { ok: false; error: ErrorCode } {
  return { ok: false, error };
}

function failFromError(error: unknown) {
  if (error instanceof AiError) return fail(AI_ERROR_CODES[error.kind]);
  console.error("[actions] unexpected error", error);
  return fail("unexpected");
}

export async function analyzeAction(input: unknown, locale: unknown): Promise<ActionResult<AnalysisView>> {
  const parsed = analyzeInputSchema.safeParse(input);
  if (!parsed.success) return fail(inputErrorCode(parsed.error));
  const feedbackLocale = localeSchema.safeParse(locale);
  if (!feedbackLocale.success) return fail("invalid_input");

  try {
    const sessionId = await getOrCreateSessionId();
    if (!(await consumeLlmQuota(sessionId))) return fail("rate_limited");

    const result = await analyzeResume(parsed.data, feedbackLocale.data);
    const analysis = await createAnalysis(sessionId, parsed.data, result);
    refresh();
    return { ok: true, data: analysis };
  } catch (error) {
    return failFromError(error);
  }
}

export async function rewriteSummaryAction(analysisId: unknown): Promise<ActionResult<string>> {
  const id = analysisIdSchema.safeParse(analysisId);
  if (!id.success) return fail("not_found");

  try {
    const sessionId = await getSessionId();
    if (!sessionId) return fail("not_found");

    const stored = await getAnalysisInput(sessionId, id.data);
    if (!stored) return fail("not_found");

    if (!(await consumeLlmQuota(sessionId))) return fail("rate_limited");

    const summary = await rewriteSummary(stored.input, stored.feedback);
    if (!(await saveRewrite(sessionId, id.data, summary))) return fail("not_found");
    return { ok: true, data: summary };
  } catch (error) {
    return failFromError(error);
  }
}

export async function deleteAnalysisAction(analysisId: unknown): Promise<ActionResult<null>> {
  const id = analysisIdSchema.safeParse(analysisId);
  if (!id.success) return fail("not_found");

  try {
    const sessionId = await getSessionId();
    if (!sessionId || !(await deleteAnalysis(sessionId, id.data))) return fail("not_found");
    return { ok: true, data: null };
  } catch (error) {
    return failFromError(error);
  }
}
