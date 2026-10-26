import "server-only";
import { db } from "./db";
import { feedbackSchema, type AnalysisResult, type AnalyzeInput, type Feedback } from "./schemas";

const HISTORY_LIMIT = 50;
const EMPTY_FEEDBACK: Feedback = { summary: "", missingKeywords: [], strengths: [], improvements: [] };

export type AnalysisSummary = { id: string; jobTitle: string; score: number; createdAt: string };
export type AnalysisView = AnalysisSummary & { feedback: Feedback; rewrittenSummary: string | null };

const viewSelect = {
  id: true,
  jobTitle: true,
  score: true,
  createdAt: true,
  feedback: true,
  rewrittenSummary: true,
} as const;

function toView(row: {
  id: string;
  jobTitle: string;
  score: number;
  createdAt: Date;
  feedback: unknown;
  rewrittenSummary: string | null;
}): AnalysisView {
  const feedback = feedbackSchema.safeParse(row.feedback);
  return {
    id: row.id,
    jobTitle: row.jobTitle,
    score: row.score,
    createdAt: row.createdAt.toISOString(),
    feedback: feedback.success ? feedback.data : EMPTY_FEEDBACK,
    rewrittenSummary: row.rewrittenSummary,
  };
}

export async function listAnalyses(sessionId: string): Promise<AnalysisSummary[]> {
  const rows = await db.analysis.findMany({
    where: { sessionId },
    select: { id: true, jobTitle: true, score: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function getAnalysis(sessionId: string, id: string): Promise<AnalysisView | null> {
  const row = await db.analysis.findFirst({ where: { id, sessionId }, select: viewSelect });
  return row ? toView(row) : null;
}

export async function getAnalysisInput(sessionId: string, id: string) {
  const row = await db.analysis.findFirst({
    where: { id, sessionId },
    select: { resumeText: true, jobDescription: true, feedback: true },
  });
  if (!row) return null;
  const feedback = feedbackSchema.safeParse(row.feedback);
  return {
    input: { resumeText: row.resumeText, jobDescription: row.jobDescription },
    feedback: feedback.success ? feedback.data : EMPTY_FEEDBACK,
  };
}

export async function createAnalysis(
  sessionId: string,
  input: AnalyzeInput,
  { jobTitle, score, ...feedback }: AnalysisResult,
): Promise<AnalysisView> {
  const row = await db.analysis.create({
    data: { sessionId, ...input, jobTitle, score, feedback },
    select: viewSelect,
  });
  return toView(row);
}

export async function saveRewrite(sessionId: string, id: string, summary: string) {
  const { count } = await db.analysis.updateMany({ where: { id, sessionId }, data: { rewrittenSummary: summary } });
  return count === 1;
}

export async function deleteAnalysis(sessionId: string, id: string) {
  const { count } = await db.analysis.deleteMany({ where: { id, sessionId } });
  return count === 1;
}
